import { Request, Response } from "express";
import { HTTP_STATUS } from "../lib";
import { 
  findUserById, 
  logger, 
  processTransferRequest, 
  createUnsignedTransaction,
  getTransactionById,
  updateTransactionStatus,
  submitSignedTransaction
} from "../services";

export const initiateTransfer = async (req: Request, res: Response) => {
 
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Authentication required",
      });
    }

    const { receiverHandle, amount, token } = req.body;

    const sender = await findUserById(req.user.userId);
    if (!sender) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Sender not found",
      });
    }

    if (!sender.wallet_address) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Sender must have a connected wallet",
      });
    }

    const transferResult = await processTransferRequest({
      senderId: sender.id,
      receiverHandle,
      amount,
      token
    });

    if (transferResult.type === 'pending') {
      logger.info("Transfer created as pending tip", { 
        pendingTipId: transferResult.pendingTipId,
        receiverHandle 
      });

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        type: 'pending',
        data: {
          pendingTipId: transferResult.pendingTipId,
          message: `Tip created for @${receiverHandle}. They will be notified to connect their wallet.`
        }
      });
    }

    const unsignedTransaction = await createUnsignedTransaction({
      senderAccountId: sender.wallet_address,
      receiverAccountId: transferResult.receiverWalletAddress!,
      amount,
      token: token || "HBAR",
      memo: `TipJar transfer: ${transferResult.transactionId}`
    });

    logger.info("Direct transfer initiated", { 
      transactionId: transferResult.transactionId,
      sender: sender.wallet_address,
      receiver: transferResult.receiverWalletAddress,
      amount 
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      type: 'direct',
      data: {
        transactionId: transferResult.transactionId,
        ...unsignedTransaction
      }
    });

  
};

export const completeTransfer = async (req: Request, res: Response) => {
 
    if (!req.user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        message: "Authentication required",
      });
    }

    const { transactionId, signedTransactionBytes } = req.body;

    // Get and validate transaction
    const transaction = await getTransactionById(transactionId);
    
    if (!transaction) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        message: "Transaction not found",
      });
    }

    if (transaction.sender_id !== req.user.userId) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        message: "Unauthorized to complete this transaction",
      });
    }

    if (transaction.status !== "pending") {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: "Transaction is not in pending state",
      });
    }

    const txHash = await submitSignedTransaction(signedTransactionBytes, transactionId);

    await updateTransactionStatus(transactionId, "confirmed", txHash);

    logger.info("Transfer completed successfully", { 
      transactionId,
      txHash 
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        transactionId,
        txHash,
        status: "confirmed"
      }
    });

  
};

export const tokenTransfer = initiateTransfer;
