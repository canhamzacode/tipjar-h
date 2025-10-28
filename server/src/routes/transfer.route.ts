import { Router } from "express";
import { initiateTransfer, completeTransfer } from "../controller/transfer";
import { authenticate, validate } from "../middleware";
import {
  asyncHandler,
  connectWalletSchema,
  transferTokenSchema,
} from "../utils";

const router = Router();

// Initiate a transfer - creates unsigned transaction
router.post(
  "/initiate",
  authenticate,
  validate(transferTokenSchema),
  asyncHandler(initiateTransfer),
);

// Complete a transfer - submits signed transaction
router.post("/complete", authenticate, asyncHandler(completeTransfer));

export default router;
