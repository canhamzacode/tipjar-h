import { Request, Response, NextFunction } from "express";
import { verifyAccessToken, DecodedToken } from "../utils/jwt";
import { HTTP_STATUS } from "../lib";
import { logger } from "../services";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

/**
 * Middleware to verify JWT token and attach user to request
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logger.warn("Missing or invalid Authorization header", {
        path: req.path,
      });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Authentication required",
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyAccessToken(token);

    if (!decoded) {
      logger.warn("Invalid or expired access token", {
        path: req.path,
      });
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Invalid or expired token",
      });
    }

    // Attach user to request
    req.user = decoded;

    logger.debug("User authenticated", {
      userId: decoded.userId,
      twitterHandle: decoded.twitterHandle,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error(
      "Authentication middleware error",
      error instanceof Error ? error : new Error(String(error)),
    );
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Authentication failed",
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token, but attaches user if valid token exists
 */
export const optionalAuthenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyAccessToken(token);

      if (decoded) {
        req.user = decoded;
      }
    }

    next();
  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};
