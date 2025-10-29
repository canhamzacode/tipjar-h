import { Router } from "express";
import { asyncHandler } from "../utils";
import { authenticate } from "../middleware";
import { getAllUserTransactions } from "../controller/transactions";

const router = Router();

router.get("/", authenticate, asyncHandler(getAllUserTransactions));

export default router as Router;
