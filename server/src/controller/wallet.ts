import { Request, Response } from "express";
import { HTTP_STATUS } from "../lib";
import { findUserById } from "../services";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export const connectWallet = async (req: Request, res: Response) => {
  const { walletAddress } = req.body;
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Authentication required",
    });
  }

  const userId = req.user.userId;

  const existingWalletUser = await db
    .select()
    .from(users)
    .where(eq(users.wallet_address, walletAddress))
    .limit(1);

  if (existingWalletUser.length > 0 && existingWalletUser[0].id !== userId) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: "This wallet is already connected to another account.",
    });
  }

  const user = await findUserById(req.user.userId);

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      error: "User not found",
    });
  }

  if (user.wallet_address === walletAddress) {
    return res.status(HTTP_STATUS.OK).json({
      message: "Wallet already connected.",
      data: { walletAddress },
    });
  }

  await db
    .update(users)
    .set({ wallet_address: walletAddress })
    .where(eq(users.id, userId));

  return res.status(HTTP_STATUS.CREATED).json({
    message: "Wallet connected.",
    data: { walletAddress },
  });
};
