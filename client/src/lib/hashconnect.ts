import { HashConnect } from 'hashconnect';
import { LedgerId } from '@hashgraph/sdk';

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
      const timeout = setTimeout(() => {
        isConnecting = false;
        reject(new Error('Connection timeout - no wallet responded within 2 minutes'));
      }, 120000);

      hc.pairingEvent.once((data: { accountIds?: string[] }) => {
        clearTimeout(timeout);
        isConnecting = false;
        
        if (data && data.accountIds && data.accountIds.length > 0) {
          const ids = data.accountIds || [];
          resolve(ids.map((id: string) => id.toString()));
        } else {
          reject(new Error('No applicable accounts found. Please ensure your wallet has testnet accounts and try again.'));
        }
      });

      try {
        hc.openPairingModal();
      } catch (modalError) {
        clearTimeout(timeout);
        isConnecting = false;
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
