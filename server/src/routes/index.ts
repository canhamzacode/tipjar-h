import { Request, Response, Router } from "express";
import authRoute from "./auth.route";
import walletRoute from "./wallet.route";
import transferRoute from "./transfer.route";
import transactionsRoute from "./transactions.route";

const router = Router();

router.use("/auth", authRoute);
router.use("/wallet", walletRoute);
router.use("/transfer", transferRoute);
router.use("/transactions", transactionsRoute);

export default router as Router;
