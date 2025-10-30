/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

import { HashConnect } from 'hashconnect';
import { LedgerId, Transaction, AccountId } from '@hashgraph/sdk';

const metadata = {
  name: 'TipJar',
  description: 'TipJar - Hedera Hashgraph DApp for Tips',
  icons: ['/favicon.ico'],
  url: 'http://localhost:3000',
};

export const hc = new HashConnect(
  LedgerId.TESTNET,
  'cf1de7a47401528d21120348bed273e1',
  metadata,
  true
);

export const hcInitPromise = hc.init();

// Add connection monitoring
hc.connectionStatusChangeEvent.on((connectionStatus) => {
  console.log('HashConnect connection status changed:', connectionStatus);
});

hc.pairingEvent.on((pairingData) => {
  console.log('HashConnect pairing event:', pairingData);
});

let isConnecting = false;
let isSigning = false;

export const getHashConnectInstance = (): HashConnect => {
  if (!hc) {
    throw new Error(
      'HashConnect not initialized. Make sure this is called on the client side.'
    );
  }
  return hc;
};

export async function connectWallet(): Promise<string[]> {
  try {
    if (isConnecting) {
      throw new Error(
        'Connection already in progress. Please wait for the current attempt to complete.'
      );
    }

    isConnecting = true;

    await hcInitPromise;
    getHashConnectInstance();

    const accountIds = hc.connectedAccountIds;
    if (accountIds && accountIds.length > 0) {
      isConnecting = false;
      return accountIds.map((id) => id.toString());
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(async () => {
        isConnecting = false;
        try {
          if (hc.connectedAccountIds && hc.connectedAccountIds.length > 0) {
            await hc.disconnect();
          }
        } catch (e) {
          // Silent cleanup
        }
        reject(
          new Error(
            'Connection timeout - no wallet responded within 60 seconds. Please try again.'
          )
        );
      }, 60000);

      const pairingHandler = (data: { accountIds?: string[] }) => {
        clearTimeout(timeout);
        isConnecting = false;

        if (data && data.accountIds && data.accountIds.length > 0) {
          const ids = data.accountIds || [];
          resolve(ids.map((id: string) => id.toString()));
        } else {
          reject(
            new Error(
              'No applicable accounts found. Please ensure your wallet has testnet accounts and try again.'
            )
          );
        }
      };

      const errorHandler = (error: any) => {
        if (error === 'Paired' || (error && error.message === 'Paired')) {
          return;
        }

        clearTimeout(timeout);
        isConnecting = false;
        reject(
          new Error(`Wallet connection failed: ${error.message || error}`)
        );
      };

      hc.pairingEvent.once(pairingHandler);
      hc.connectionStatusChangeEvent.once(errorHandler);

      try {
        hc.openPairingModal();
      } catch (modalError) {
        clearTimeout(timeout);
        isConnecting = false;

        hc.pairingEvent.off(pairingHandler);
        hc.connectionStatusChangeEvent.off(errorHandler);

        reject(new Error(`Failed to open pairing modal: ${modalError}`));
      }
    });
  } catch (error) {
    isConnecting = false;
    throw new Error(`HashConnect initialization failed: ${error}`);
  }
}

export async function disconnectWallet() {
  try {
    const accountIds = hc.connectedAccountIds;
    if (accountIds && accountIds.length > 0) {
      await hc.disconnect();
    }
  } catch (error) {
    throw new Error(`Failed to disconnect wallet: ${error}`);
  }
}

export function getAccountIds(): string[] {
  const accountIds = hc.connectedAccountIds || [];
  console.log('getAccountIds called:', {
    hasHashConnect: !!hc,
    connectedAccountIds: accountIds,
    accountCount: accountIds.length,
    timestamp: new Date().toISOString(),
  });
  return accountIds.map((id) => id.toString());
}

export function resetConnectionState(): void {
  isConnecting = false;
}

export function resetSigningState(): void {
  isSigning = false;
  console.log('Signing state reset');
}

export async function checkAndRestoreConnection(): Promise<boolean> {
  try {
    await hcInitPromise;

    const accountIds = hc.connectedAccountIds || [];
    console.log('Connection check:', {
      hasAccounts: accountIds.length > 0,
      accountIds: accountIds.map((id) => id.toString()),
    });

    if (accountIds.length > 0) {
      return true;
    }

    // Try to restore from persisted state
    if (typeof window !== 'undefined') {
      const storage = localStorage.getItem('tipjar-app-storage');
      if (storage) {
        try {
          const parsed = JSON.parse(storage);
          const persistedAccountId = parsed.state?.accountId;

          if (persistedAccountId) {
            console.log(
              'Attempting to restore connection for:',
              persistedAccountId
            );
            // The connection might be restored automatically by HashConnect
            // Give it a moment to reconnect
            await new Promise((resolve) => setTimeout(resolve, 2000));

            const newAccountIds = hc.connectedAccountIds || [];
            return newAccountIds.length > 0;
          }
        } catch (e) {
          console.error('Failed to parse persisted state:', e);
        }
      }
    }

    return false;
  } catch (error) {
    console.error('Connection check failed:', error);
    return false;
  }
}

export function debugConnectionState(): void {
  console.log('HashConnect Debug Info:', {
    isConnecting,
    connectedAccountIds: hc.connectedAccountIds,
    initialized: !!hc,
    hasAccounts: !!(
      hc.connectedAccountIds && hc.connectedAccountIds.length > 0
    ),
  });

  if (typeof window !== 'undefined') {
    const persistedState = localStorage.getItem('tipjar-app-storage');
    console.log(
      'Persisted wallet state:',
      persistedState ? JSON.parse(persistedState) : 'None'
    );
  }
}

export async function forceResetConnection(): Promise<void> {
  isConnecting = false;

  try {
    if (hc.connectedAccountIds && hc.connectedAccountIds.length > 0) {
      await hc.disconnect();
    }
  } catch (e) {
    // Silent cleanup
  }

  if (typeof window !== 'undefined') {
    const storage = localStorage.getItem('tipjar-app-storage');
    if (storage) {
      try {
        const parsed = JSON.parse(storage);
        parsed.state = {
          ...parsed.state,
          accountId: null,
          isConnected: false,
        };
        localStorage.setItem('tipjar-app-storage', JSON.stringify(parsed));
      } catch (e) {
        localStorage.removeItem('tipjar-app-storage');
      }
    }
  }
}

export async function signTransaction(
  transactionBytes: string
): Promise<string> {
  // Prevent multiple signing attempts
  if (isSigning) {
    throw new Error('Transaction signing already in progress. Please wait.');
  }

  isSigning = true;

  try {
    console.log('Starting transaction signing process...');
    await hcInitPromise;

    // Get current account IDs with detailed logging
    const accountIds = hc.connectedAccountIds || [];
    console.log('HashConnect state during signing:', {
      connectedAccountIds: accountIds,
      accountCount: accountIds.length,
      firstAccount: accountIds.length > 0 ? accountIds[0] : 'none',
      hasHashConnect: !!hc,
    });

    if (!accountIds || accountIds.length === 0) {
      throw new Error(
        'No connected accounts found. Please connect your wallet first.'
      );
    }

    const accountIdForSigning = accountIds[0];
    if (!accountIdForSigning) {
      throw new Error('Invalid account ID. Please reconnect your wallet.');
    }

    console.log(
      'Attempting to sign transaction with account:',
      accountIdForSigning.toString()
    );

    let result: any;

    try {
      // Parse the transaction to understand its structure
      const transactionBuffer = Buffer.from(transactionBytes, 'base64');
      console.log('Transaction buffer length:', transactionBuffer.length);

      let transaction: any;
      try {
        transaction = Transaction.fromBytes(transactionBuffer);
        console.log('Successfully parsed transaction');

        // Log transaction details for debugging
        console.log('Transaction details:', {
          transactionId: transaction.transactionId?.toString(),
          nodeAccountIds: transaction.nodeAccountIds?.map((id: any) =>
            id.toString()
          ),
          nodeCount: transaction.nodeAccountIds?.length,
          memo: transaction.transactionMemo,
        });
      } catch (parseError) {
        console.log('Failed to parse transaction:', parseError);
        throw new Error('Unable to parse transaction bytes');
      }

      // Try the simplest approach first - direct signing with string account ID and transaction bytes
      console.log(
        'Attempting direct signing with string account ID and base64 bytes...'
      );
      result = await (hc as any).signTransaction(
        accountIdForSigning.toString(),
        transactionBytes
      );
      console.log('Direct signing successful');
    } catch (firstError) {
      console.log(
        'Direct signing failed, trying with Transaction object:',
        firstError
      );

      try {
        // Try with parsed transaction object
        const transactionBuffer = Buffer.from(transactionBytes, 'base64');
        const transaction = Transaction.fromBytes(transactionBuffer);

        result = await (hc as any).signTransaction(
          accountIdForSigning.toString(),
          transaction as any
        );
        console.log('Transaction object signing successful');
      } catch (secondError) {
        console.log(
          'Transaction object signing failed, trying with AccountId object:',
          secondError
        );

        try {
          const transactionBuffer = Buffer.from(transactionBytes, 'base64');
          const transaction = Transaction.fromBytes(transactionBuffer);
          const accountIdObj = AccountId.fromString(
            accountIdForSigning.toString()
          );

          result = await (hc as any).signTransaction(
            accountIdObj as any,
            transaction as any
          );
          console.log('AccountId object signing successful');
        } catch (thirdError) {
          // Helper function to safely extract error messages
          const getErrorMessage = (error: unknown): string => {
            if (error instanceof Error) {
              return error.message;
            }
            return String(error || 'Unknown error');
          };

          const firstErrorMsg = getErrorMessage(firstError);
          const secondErrorMsg = getErrorMessage(secondError);
          const thirdErrorMsg = getErrorMessage(thirdError);

          console.error('All signing attempts failed:', {
            firstError: firstErrorMsg,
            secondError: secondErrorMsg,
            thirdError: thirdErrorMsg,
          });

          // Check if this is a batch transaction issue
          const batchErrorKeywords = [
            'Signature array must match',
            'batch',
            'multiple transactions',
          ];
          const hasBatchError = batchErrorKeywords.some(
            (keyword) =>
              firstErrorMsg.toLowerCase().includes(keyword.toLowerCase()) ||
              secondErrorMsg.toLowerCase().includes(keyword.toLowerCase()) ||
              thirdErrorMsg.toLowerCase().includes(keyword.toLowerCase())
          );

          if (hasBatchError) {
            throw new Error(
              'This appears to be a batch transaction. Batch transactions may not be supported by your wallet. Please try with a single transaction.'
            );
          }

          throw new Error(`HashConnect signing failed: ${firstErrorMsg}`);
        }
      }
    }

    console.log('Signing result received:', {
      type: typeof result,
      isString: typeof result === 'string',
      hasToBytes: result && typeof result.toBytes === 'function',
      hasSignedTransaction: result && result.signedTransaction,
      hasBytes: result && result.bytes,
    });

    // Process the result with better type safety
    let signedTransactionBytes: string;

    try {
      if (typeof result === 'string') {
        signedTransactionBytes = result;
        console.log('Using result as string directly');
      } else if (result && typeof result.toBytes === 'function') {
        signedTransactionBytes = Buffer.from(result.toBytes()).toString(
          'base64'
        );
        console.log('Using result.toBytes()');
      } else if (result && result.signedTransaction) {
        const signedTx = result.signedTransaction;
        if (typeof signedTx === 'string') {
          signedTransactionBytes = signedTx;
          console.log('Using result.signedTransaction as string');
        } else if (signedTx && typeof signedTx.toBytes === 'function') {
          signedTransactionBytes = Buffer.from(signedTx.toBytes()).toString(
            'base64'
          );
          console.log('Using result.signedTransaction.toBytes()');
        } else {
          signedTransactionBytes = Buffer.from(signedTx).toString('base64');
          console.log('Converting result.signedTransaction to buffer');
        }
      } else if (result && result.bytes) {
        signedTransactionBytes = Buffer.from(result.bytes).toString('base64');
        console.log('Using result.bytes');
      } else {
        signedTransactionBytes = Buffer.from(result).toString('base64');
        console.log('Converting result directly to buffer');
      }
    } catch (processingError) {
      console.error('Error processing signing result:', processingError);
      throw new Error(
        `Failed to process signing result: ${
          processingError instanceof Error
            ? processingError.message
            : String(processingError)
        }`
      );
    }

    console.log('Transaction signed successfully, returning bytes');
    return signedTransactionBytes;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    const errorMessage =
      error instanceof Error ? error.message : String(error || 'Unknown error');
    throw new Error(`Failed to sign transaction: ${errorMessage}`);
  } finally {
    isSigning = false;
  }
}
