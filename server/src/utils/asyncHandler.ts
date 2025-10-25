import { Request, Response, NextFunction } from "express";

/**
 * Wrapper for async route handlers to catch errors and pass to error middleware
 * Usage: router.get('/path', asyncHandler(myAsyncController))
 */
export const asyncHandler =
  (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) =>
  (req: any, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
