import jwt from "jsonwebtoken";
import { logger } from "../services";

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret-in-production";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "change-this-refresh-secret-in-production";

const ACCESS_TOKEN_EXPIRY = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRY = "7d"; // 7 days

export interface TokenPayload {
  userId: string;
  twitterId: string;
  twitterHandle: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  try {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY,
    });
  } catch (error) {
    logger.error(
      "Failed to generate access token",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw new Error("Token generation failed");
  }
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  try {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY,
    });
  } catch (error) {
    logger.error(
      "Failed to generate refresh token",
      error instanceof Error ? error : new Error(String(error)),
    );
    throw new Error("Token generation failed");
  }
};

export const verifyAccessToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug("Access token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid access token");
    }
    return null;
  }
};

export const verifyRefreshToken = (token: string): DecodedToken | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.debug("Refresh token expired");
    } else if (error instanceof jwt.JsonWebTokenError) {
      logger.warn("Invalid refresh token");
    }
    return null;
  }
};

export const generateTokenPair = (
  payload: TokenPayload,
): { accessToken: string; refreshToken: string } => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
