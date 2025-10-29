import { Request, Response } from "express";
import { HTTP_STATUS } from "../lib";
import { findUserById } from "../services";
import { getUserTransactions } from "../services/transaction.service";

export const getAllUserTransactions = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      message: "Authentication required",
    });
  }

  const userId = req.user.userId;

  const user = await findUserById(userId);
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      error: "User not found",
    });
  }

  const transactions = await getUserTransactions(userId);

  return res.status(HTTP_STATUS.OK).json({
    transactions,
  });
};
