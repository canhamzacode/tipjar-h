import { Request, Response, Router } from "express";
import authRoute from "./auth.route";
import walletRoute from "./wallet.route";

const router = Router();

router.use("/auth", authRoute);
router.use("/wallet", walletRoute);

export default router as Router;
