import type { StateCreator } from 'zustand';

export type WalletState = {
  accountId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  rehydrateConnection: () => Promise<void>;
};

export const createWalletSlice: StateCreator<WalletState> = (set) => ({
  accountId: null,
  isConnected: false,
  isConnecting: false,

  connect: async () => {
    if (typeof window === 'undefined') return;

    const currentState = (set as unknown as { getState?: () => WalletState }).getState?.() || {} as WalletState;
    if (currentState.isConnecting) {
      return;
    }

    const { connectWallet } = await import('../lib/hashconnect');

    set({ isConnecting: true });
    try {
      const accounts = await connectWallet();
      if (accounts && accounts.length > 0 && accounts[0]) {
        set({ accountId: accounts[0], isConnected: true });
      }
    } catch (error) {
      set({ isConnecting: false });
      throw error;
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnect: async () => {
    try {
      const { disconnectWallet } = await import('../lib/hashconnect');
      await disconnectWallet();
      set({ accountId: null, isConnected: false });
    } catch {
    }
  },

  rehydrateConnection: async () => {
    if (typeof window === 'undefined') return;

    const currentState = (set as unknown as { getState?: () => WalletState }).getState?.() || {} as WalletState;
    
    if (!currentState.accountId || currentState.isConnecting) {
      return;
    }

    try {
      const { getAccountIds } = await import('../lib/hashconnect');
      const connectedAccountIds = getAccountIds();
      
      if (connectedAccountIds && connectedAccountIds.includes(currentState.accountId)) {
        set({ isConnected: true });
      } else {
        set({ accountId: null, isConnected: false });
      }
    } catch {
      set({ accountId: null, isConnected: false });
    }
  },
});
