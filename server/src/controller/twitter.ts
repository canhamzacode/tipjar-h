import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS } from "../lib";
import {
  logger,
  upsertUserFromTwitter,
  reconcilePendingTipsForHandle,
  findUserById,
} from "../services";
import {
  saveOAuthState,
  getOAuthState,
  deleteOAuthState,
} from "../services/oauth-state.service";
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

  // Store OAuth state in database instead of session
  await saveOAuthState(state, codeVerifier);

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
    receivedState: state,
    hasCode: !!code,
  });

  // Get OAuth state from database instead of session
  const oauthData = await getOAuthState(state);
  if (!oauthData?.code_verifier) {
    logger.warn("Invalid OAuth state - data not found or expired", { state });
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: "Invalid or expired OAuth state - please restart authentication",
    });
  }

  // Check if state has expired
  if (new Date() > oauthData.expires_at) {
    logger.warn("OAuth state expired", { state, expiresAt: oauthData.expires_at });
    await deleteOAuthState(state);
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: "OAuth state expired - please restart authentication",
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
    codeVerifier: oauthData.code_verifier,
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

  // Clean up OAuth state from database
  await deleteOAuthState(state);

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
