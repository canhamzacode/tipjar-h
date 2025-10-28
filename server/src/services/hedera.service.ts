import {
  TransferTransaction,
  AccountId,
  Hbar,
  HbarUnit,
  Transaction,
  Client,
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
  const hbarPriceUsd = 0.05; // Assuming 1 HBAR = $0.05 (adjust based on current rate)
  const hbarAmount = transactionData.amount / hbarPriceUsd; // Convert USD to HBAR

  logger.info("Amount conversion", {
    usdAmount: transactionData.amount,
    hbarAmount,
    hbarPriceUsd
  });

  // Get Hedera client for freezing the transaction
  const client = getHederaClient();

  const transferTx = new TransferTransaction()
    .addHbarTransfer(
      senderAccountId,
      new Hbar(-hbarAmount, HbarUnit.Hbar),
    )
    .addHbarTransfer(
      receiverAccountId,
      new Hbar(hbarAmount, HbarUnit.Hbar),
    )
    .setTransactionMemo(transactionData.memo || "TipJar transfer")
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
    amount: hbarAmount, // Return the converted HBAR amount
    token: transactionData.token || "HBAR",
  };
}

/**
 * Submits a signed transaction to the Hedera network
 */
export async function submitSignedTransaction(
  signedTransactionBytes: string,
  transactionId: string,
): Promise<string> {
  logger.info("Submitting signed transaction to Hedera", {
    transactionId,
    signedTransactionBytes: signedTransactionBytes.substring(0, 50) + "...",
  });

    // 1. Reconstruct the transaction from bytes
    const transactionBuffer = Buffer.from(signedTransactionBytes, 'base64');
    const signedTransaction = Transaction.fromBytes(transactionBuffer);

    // 2. Get Hedera client (you'll need to configure this)
    const client = getHederaClient();
    
    // 3. Submit to Hedera network
    logger.info("Executing transaction on Hedera network", { transactionId });
    const txResponse = await signedTransaction.execute(client);
    
    
    // 4. Get transaction receipt for confirmation
    logger.info("Getting transaction receipt", { 
      transactionId, 
      hederaTxId: txResponse.transactionId.toString() 
    });
    
    const receipt = await txResponse.getReceipt(client);
    
    // 5. Verify transaction was successful
    if (receipt.status.toString() !== "SUCCESS") {
      throw new Error(`Transaction failed with status: ${receipt.status.toString()}`);
    }

    const txHash = txResponse.transactionId.toString();

    logger.info("Transaction submitted successfully", {
      transactionId,
      hederaTxId: txHash,
      status: receipt.status.toString()
    });

    return txHash;
}


function getHederaClient() {
  const client = Client.forTestnet();
  
  const operatorId = process.env.HEDERA_OPERATOR_ID;
  const operatorKey = process.env.HEDERA_OPERATOR_KEY;
  
  if (operatorId && operatorKey) {
    logger.info("Setting Hedera operator account", { operatorId });
    client.setOperator(operatorId, operatorKey);
  } else {
    logger.warn("Hedera operator credentials not found. Transactions may fail without operator account.");
    logger.warn("Please set HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY environment variables.");
  }
  
  return client;
}

export function validateAccountId(accountId: string): boolean {
  AccountId.fromString(accountId);
  return true;
}
