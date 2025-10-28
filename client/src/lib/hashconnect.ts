import { HashConnect } from 'hashconnect';
import { LedgerId, Transaction, AccountId } from '@hashgraph/sdk';

const metadata = {
  name: 'TipJar',
  description: 'TipJar - Hedera Hashgraph DApp for Tips',
  icons: [
    '/favicon.ico',
  ],
  url: 'http://localhost:3000',
};

export const hc = new HashConnect(
  LedgerId.TESTNET,
  'cf1de7a47401528d21120348bed273e1',
  metadata,
  true
);

export const hcInitPromise = hc.init();

let isConnecting = false;

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
      throw new Error('Connection already in progress. Please wait for the current attempt to complete.');
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
        reject(new Error('Connection timeout - no wallet responded within 60 seconds. Please try again.'));
      }, 60000);

      const pairingHandler = (data: { accountIds?: string[] }) => {
        clearTimeout(timeout);
        isConnecting = false;
        
        if (data && data.accountIds && data.accountIds.length > 0) {
          const ids = data.accountIds || [];
          resolve(ids.map((id: string) => id.toString()));
        } else {
          reject(new Error('No applicable accounts found. Please ensure your wallet has testnet accounts and try again.'));
        }
      };

      const errorHandler = (error: any) => {
        if (error === 'Paired' || (error && error.message === 'Paired')) {
          return;
        }
        
        clearTimeout(timeout);
        isConnecting = false;
        reject(new Error(`Wallet connection failed: ${error.message || error}`));
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
  return accountIds.map((id) => id.toString());
}

export function resetConnectionState(): void {
  isConnecting = false;
}

export function debugConnectionState(): void {
  console.log('HashConnect Debug Info:', {
    isConnecting,
    connectedAccountIds: hc.connectedAccountIds,
    initialized: !!hc,
    hasAccounts: !!(hc.connectedAccountIds && hc.connectedAccountIds.length > 0)
  });
  
  if (typeof window !== 'undefined') {
    const persistedState = localStorage.getItem('tipjar-app-storage');
    console.log('Persisted wallet state:', persistedState ? JSON.parse(persistedState) : 'None');
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
          isConnected: false
        };
        localStorage.setItem('tipjar-app-storage', JSON.stringify(parsed));
      } catch (e) {
        localStorage.removeItem('tipjar-app-storage');
      }
    }
  }
}

export async function signTransaction(transactionBytes: string): Promise<string> {
  try {
    await hcInitPromise;
    
    const accountIds = getAccountIds();
    if (!accountIds || accountIds.length === 0) {
      throw new Error('No connected accounts');
    }

    const accountIdForSigning = accountIds[0];
    
    let result: any;
    
    try {
      result = await (hc as any).signTransaction(accountIdForSigning, transactionBytes);
    } catch (firstError) {
      try {
        const transactionBuffer = Buffer.from(transactionBytes, 'base64');
        const transaction = Transaction.fromBytes(transactionBuffer);
          
        const accountIdObj = AccountId.fromString(accountIdForSigning);
        result = await (hc as any).signTransaction(accountIdObj as any, transaction as any);
      } catch (secondError) {
        try {
          const transactionBuffer = Buffer.from(transactionBytes, 'base64');
          const transaction = Transaction.fromBytes(transactionBuffer);
          result = await (hc as any).signTransaction(accountIdForSigning, transaction as any);
        } catch (thirdError) {
          const errorMsg = firstError instanceof Error ? firstError.message : String(firstError);
          throw new Error(`HashConnect signing failed: ${errorMsg}`);
        }
      }
    }
    
    let signedTransactionBytes: string;
    
    if (typeof result === 'string') {
      signedTransactionBytes = result;
    } else if (result && typeof result.toBytes === 'function') {
      signedTransactionBytes = Buffer.from(result.toBytes()).toString('base64');
    } else if (result && result.signedTransaction) {
      const signedTx = result.signedTransaction;
      if (typeof signedTx === 'string') {
        signedTransactionBytes = signedTx;
      } else if (signedTx && typeof signedTx.toBytes === 'function') {
        signedTransactionBytes = Buffer.from(signedTx.toBytes()).toString('base64');
      } else {
        signedTransactionBytes = Buffer.from(signedTx).toString('base64');
      }
    } else {
      signedTransactionBytes = Buffer.from(result).toString('base64');
    }
    
    return signedTransactionBytes;
    
  } catch (error) {
    throw new Error(`Failed to sign transaction: ${error}`);
  }
}
