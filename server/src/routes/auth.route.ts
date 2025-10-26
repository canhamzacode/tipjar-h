import { Router } from "express";
import {
  handleTwitterCallback,
  initiateTwitterOAuth,
  getMe,
  refreshAccessToken,
  logout,
} from "../controller";
import { authenticate, validate } from "../middleware";
import {
  twitterCallbackSchema,
  refreshTokenSchema,
  asyncHandler,
} from "../utils";

const router = Router();

router.get("/twitter", asyncHandler(initiateTwitterOAuth));
router.get(
  "/twitter/callback",
  validate(twitterCallbackSchema),
  asyncHandler(handleTwitterCallback),
);

router.get("/me", authenticate, asyncHandler(getMe));
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  asyncHandler(refreshAccessToken),
);
router.post("/logout", authenticate, asyncHandler(logout));

export default router;
