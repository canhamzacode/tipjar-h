import { Router } from "express";
import {
  initiateTransfer,
  completeTransfer,
  getTransferById,
} from "../controller/transfer";
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

// Get unsigned transaction details (for sender to fetch and sign)
router.get("/:id", authenticate, asyncHandler(getTransferById));

export default router;
