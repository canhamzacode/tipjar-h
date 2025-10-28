import { HashConnect } from 'hashconnect';
import { LedgerId } from '@hashgraph/sdk';

const metadata = {
  name: 'HederaAir',
  description: 'HederaAir - Hedera Hashgraph DApp',
  icons: [
    typeof window !== 'undefined'
      ? window.location.origin + '/favicon.ico'
      : '/favicon.ico',
  ],
  url: 'http://localhost:3000',
};

export const hc = new HashConnect(
  LedgerId.TESTNET,
  process.env.NEXT_PUBLIC_HASHCONNECT_PROJECT_ID || '',
  metadata,
  true
);

export const hcInitPromise = hc.init();

export const getHashConnectInstance = (): HashConnect => {
  if (!hc) {
    throw new Error(
      'HashConnect not initialized. Make sure this is called on the client side.'
    );
  }
  return hc;
};

export async function connectWallet(): Promise<string[]> {
  await hcInitPromise;
  getHashConnectInstance();

  const accountIds = hc.connectedAccountIds;
  if (accountIds && accountIds.length > 0) {
    return accountIds.map((id) => id.toString());
  }

  // New pairing
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Connection timeout')),
      120000
    );

    hc.pairingEvent.once((data: any) => {
      clearTimeout(timeout);
      const ids = data.accountIds || [];
      resolve(ids.map((id: any) => id.toString()));
    });

    hc.openPairingModal;
  });
}

export async function disconnectWallet() {
  const accountIds = hc.connectedAccountIds;
  if (accountIds && accountIds.length > 0) {
    await hc.disconnect();
  }
}

export function getAccountIds(): string[] {
  const accountIds = hc.connectedAccountIds || [];
  return accountIds.map((id) => id.toString());
}
