import { Request, Response } from "express";
import { HTTP_STATUS } from "../lib";
import { logger } from "../services";
import { createOAuthClient, generateOAuthLink } from "../utils";
import { db } from "../db";
import { users } from "../db/schema";

export const initiateTwitterOath = async (req: Request, res: Response) => {
  try {
    const { url, codeVerifier, state } = generateOAuthLink();

    req.session.oauth = {
      codeVerifier,
      state,
    };

    logger.info("Twitter OAuth initiated", {
      state,
    });

    return res.status(HTTP_STATUS.OK).json({
      message: "Twitter Auth Initiated",
      data: { url },
    });
  } catch (error) {
    logger.error(
      "Error initiating Twitter OAuth",
      error instanceof Error ? error : new Error(String(error)),
    );
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to initiate Twitter authentication",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const handleTwitterCallback = async (
  req: Request<{}, {}, {}, { code: string; state: string }>,
  res: Response,
) => {
  const { code, state } = req.query;

  const oauthData = req.session.oauth;
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

  // check if user exist in the db already
  // update the information or instert into a new row
  //

  return res.status(HTTP_STATUS.OK).json({
    message: "User Authenticated Sucessfully",
    data: userObject,
  });
};
