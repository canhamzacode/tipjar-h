import {
  TransferTransaction,
  AccountId,
  Hbar,
  HbarUnit,
  Transaction,
  Client,
  PrivateKey,
} from "@hashgraph/sdk";
import { logger } from "./logger.service";

export interface HederaTransactionData {
  senderAccountId: string;
  receiverAccountId: string;
  amount: number;
  token?: string;
  memo?: string;
}

export interface UnsignedTransactionResult {
  transactionBytes: string;
  senderAccountId: string;
  receiverAccountId: string;
  amount: number;
  token: string;
}

export async function createUnsignedTransaction(
  transactionData: HederaTransactionData,
): Promise<UnsignedTransactionResult> {
  logger.info("Creating unsigned Hedera transaction", transactionData);

  const senderAccountId = AccountId.fromString(transactionData.senderAccountId);
  const receiverAccountId = AccountId.fromString(
    transactionData.receiverAccountId,
  );

  // Convert USD amount to HBAR (rough conversion for testing)
  // TODO: Use real-time exchange rate API
  const hbarAmount = transactionData.amount; // Convert USD to HBAR

  logger.info("Amount conversion", {
    usdAmount: transactionData.amount,
    hbarAmount,
  });

  // Get Hedera client for freezing the transaction
  const client = getHederaClient();

  const transferTx = new TransferTransaction()
    .addHbarTransfer(senderAccountId, new Hbar(-hbarAmount, HbarUnit.Hbar))
    .addHbarTransfer(receiverAccountId, new Hbar(hbarAmount, HbarUnit.Hbar))
    .setTransactionMemo(transactionData.memo || "TipJar transfer")
    .setNodeAccountIds([AccountId.fromString("0.0.3")]) // Use single node to avoid batch signing issues
    .freezeWith(client);

  const transactionBytes = Buffer.from(transferTx.toBytes()).toString("base64");

  logger.info("Unsigned transaction created successfully", {
    senderAccountId: transactionData.senderAccountId,
    receiverAccountId: transactionData.receiverAccountId,
    usdAmount: transactionData.amount,
    hbarAmount,
  });

  return {
    transactionBytes,
    senderAccountId: transactionData.senderAccountId,
    receiverAccountId: transactionData.receiverAccountId,
    amount: hbarAmount,
    token: transactionData.token || "HBAR",
  };
}

export async function submitSignedTransaction(
  signedTransactionBytes: string,
  transactionId: string,
): Promise<string> {
  logger.info("Submitting signed transaction to Hedera", {
    transactionId,
    signedTransactionBytes: signedTransactionBytes.substring(0, 50) + "...",
  });

  // 1. Reconstruct the transaction from bytes
  const transactionBuffer = Buffer.from(signedTransactionBytes, "base64");
  const signedTransaction = Transaction.fromBytes(transactionBuffer);

  // 2. Get Hedera client (you'll need to configure this)
  const client = getHederaClient();

  // 3. Submit to Hedera network
  logger.info("Executing transaction on Hedera network", { transactionId });
  const txResponse = await signedTransaction.execute(client);

  logger.info("Getting transaction receipt", {
    transactionId,
    hederaTxId: txResponse.transactionId.toString(),
  });

  const receipt = await txResponse.getReceipt(client);

  // 5. Verify transaction was successful
  if (receipt.status.toString() !== "SUCCESS") {
    throw new Error(
      `Transaction failed with status: ${receipt.status.toString()}`,
    );
  }

  const txHash = txResponse.transactionId.toString();

  logger.info("Transaction submitted successfully", {
    transactionId,
    hederaTxId: txHash,
    status: receipt.status.toString(),
  });

  return txHash;
}

function getHederaClient() {
  const client = Client.forTestnet();

  const operatorIdStr = process.env.HEDERA_OPERATOR_ID;
  const operatorKeyStr = process.env.HEDERA_OPERATOR_KEY;

  if (operatorIdStr && operatorKeyStr) {
    try {
      const operatorId = AccountId.fromString(operatorIdStr);
      // Accept raw key string and convert to SDK PrivateKey instance
      const operatorKey = PrivateKey.fromString(operatorKeyStr);

      logger.info("Setting Hedera operator account", {
        operatorId: operatorId.toString(),
      });
      client.setOperator(operatorId, operatorKey);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("Invalid Hedera operator credentials", new Error(msg));
      logger.warn(
        "Hedera operator credentials invalid. Transactions may fail without a valid operator.",
      );
    }
  } else {
    logger.warn(
      "Hedera operator credentials not found. Transactions may fail without operator account.",
    );
    logger.warn(
      "Please set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY environment variables.",
    );
  }

  return client;
}

export function validateAccountId(accountId: string): boolean {
  AccountId.fromString(accountId);
  return true;
}
