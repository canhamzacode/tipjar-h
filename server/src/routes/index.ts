import { Request, Response, Router } from "express";
import authRoute from "./auth.route";
import walletRoute from "./wallet.route";
import transferRoute from "./transfer.route";

const router = Router();

router.use("/auth", authRoute);
router.use("/wallet", walletRoute);
router.use("/transfer", transferRoute);

export default router as Router;
