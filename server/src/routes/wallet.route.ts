import { Router } from "express";
import { asyncHandler, connectWalletSchema } from "../utils";
import { authenticate, validate } from "../middleware";
import { connectWallet } from "../controller";

const router = Router();

router.post(
  "/connect",
  authenticate,
  validate(connectWalletSchema),
  asyncHandler(connectWallet),
);

export default router as Router;
