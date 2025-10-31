import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../lib";
import {
  logger,
  upsertUserFromTwitter,
  reconcilePendingTipsForHandle,
  findUserById,
} from "../services";
import {
  createOAuthClient,
  generateOAuthLink,
  generateTokenPair,
  verifyRefreshToken,
} from "../utils";

export const initiateTwitterOAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { url, codeVerifier, state } = generateOAuthLink();

  req.session.oauth = {
    codeVerifier,
    state,
  };

  logger.info("Twitter OAuth initiated", { state });

  return res.status(HTTP_STATUS.OK).json({
    message: "Twitter Auth Initiated",
    data: { url },
  });
};

export const handleTwitterCallback = async (
  req: Request<{}, {}, {}, { code: string; state: string }>,
  res: Response,
  next: NextFunction,
) => {
  const { code, state } = req.query;
  logger.debug("Twitter callback received", {
    cookieHeader: req.headers?.cookie ?? null,
    sessionPresent: !!req.session,
    sessionKeys: req.session ? Object.keys(req.session) : [],
  });

  const oauthData = req.session?.oauth;
  if (!oauthData?.codeVerifier || !oauthData?.state) {
    logger.warn("Invalid session - OAuth data not found");
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: "Invalid session - please restart authentication",
    });
  }

  if (state !== oauthData.state) {
    logger.warn("OAuth state mismatch - possible CSRF attempt", {
      receivedState: state,
      expectedState: oauthData.state,
    });
    return res.status(HTTP_STATUS.FORBIDDEN).json({
      message: "Invalid state parameter - security check failed",
    });
  }

  // Exchange code for tokens
  const client = createOAuthClient();
  const {
    client: loggedClient,
    accessToken,
    refreshToken,
    expiresIn,
  } = await client.loginWithOAuth2({
    code,
    codeVerifier: oauthData.codeVerifier,
    redirectUri: process.env.OAUTH2_CALLBACK_URL!,
  });

  logger.info("OAuth token exchange successful");

  const { data: userObject } = await loggedClient.v2.me({
    "user.fields": [
      "id",
      "name",
      "username",
      "profile_image_url",
      "created_at",
      "description",
    ],
  });

  logger.info("User authenticated successfully", {
    userId: userObject.id,
    username: userObject.username,
  });

  const twitterId = String(userObject.id);

  const savedUser = await upsertUserFromTwitter({
    twitterId,
    twitterHandle: userObject.username,
    name: userObject.name || null,
    profileImageUrl: (userObject as any).profile_image_url || null,
    description: (userObject as any).description || null,
    accessToken: accessToken || null,
    refreshToken: refreshToken || null,
    expiresIn: expiresIn || null,
  });

  if (!savedUser) {
    throw new Error("Failed to save user to database");
  }

  const reconciledCount = await reconcilePendingTipsForHandle(
    userObject.username,
    savedUser.id,
  );

  delete req.session.oauth;

  const tokens = generateTokenPair({
    userId: savedUser.id,
    twitterId: savedUser.twitter_id!,
    twitterHandle: savedUser.twitter_handle!,
  });

  logger.info("Twitter account linked successfully", {
    userId: savedUser.id,
    twitterHandle: savedUser.twitter_handle,
    reconciledTips: reconciledCount,
  });

  const redirectUrl =
    `${process.env.CLIENT_URL}/auth/callback?` +
    new URLSearchParams({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      twitter_handle: savedUser.twitter_handle!,
      name: savedUser.name || "",
      profile_image_url: savedUser.profile_image_url || "",
    }).toString();

  return res.redirect(redirectUrl);
};

export const getMe = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Authentication required",
    });
  }

  const user = await findUserById(req.user.userId);

  if (!user) {
    logger.warn("User not found in database", { userId: req.user.userId });
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: "User not found",
    });
  }

  logger.debug("User info retrieved", { userId: user.id });

  return res.status(HTTP_STATUS.OK).json({
    message: "User info retrieved successfully",
    data: {
      user: {
        id: user.id,
        twitter_id: user.twitter_id,
        twitter_handle: user.twitter_handle,
        name: user.name,
        profile_image_url: user.profile_image_url,
        description: user.description,
        wallet_address: user.wallet_address,
        wallet_type: user.wallet_type,
        created_at: user.created_at,
      },
    },
  });
};

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: "Refresh token is required",
    });
  }

  const decoded = verifyRefreshToken(refresh_token);

  if (!decoded) {
    logger.warn("Invalid or expired refresh token");
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Invalid or expired refresh token",
    });
  }

  const user = await findUserById(decoded.userId);

  if (!user) {
    logger.warn("User not found for refresh token", {
      userId: decoded.userId,
    });
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "User not found",
    });
  }

  const tokens = generateTokenPair({
    userId: user.id,
    twitterId: user.twitter_id!,
    twitterHandle: user.twitter_handle!,
  });

  logger.info("Access token refreshed", { userId: user.id });

  return res.status(HTTP_STATUS.OK).json({
    message: "Token refreshed successfully",
    data: {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    },
  });
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Authentication required",
    });
  }

  logger.info("User logged out", {
    userId: req.user.userId,
    twitterHandle: req.user.twitterHandle,
  });

  // TODO: Add token to blacklist in Redis for immediate invalidation
  // For now, client should delete tokens on their end

  return res.status(HTTP_STATUS.OK).json({
    message: "Logged out successfully",
  });
};
