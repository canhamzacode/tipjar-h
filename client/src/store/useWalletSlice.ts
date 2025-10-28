import type { StateCreator } from 'zustand';

export type WalletState = {
  accountId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  rehydrateConnection: () => Promise<void>;
  forceReset: () => Promise<void>;
  debugConnection: () => void;
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

    const { connectWallet } = await import('@/lib/hashconnect');

    set({ isConnecting: true });
    try {
      const accounts = await connectWallet();
      if (accounts && accounts.length > 0 && accounts[0]) {
        set({ accountId: accounts[0], isConnected: true, isConnecting: false });
      } else {
        set({ isConnecting: false });
        throw new Error('No accounts found in wallet');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage === 'Wallet connection failed: Paired') {
        setTimeout(async () => {
          try {
            const { getAccountIds } = await import('@/lib/hashconnect');
            const accounts = getAccountIds();
            if (accounts && accounts.length > 0) {
              set({ accountId: accounts[0], isConnected: true, isConnecting: false });
              return;
            }
          } catch (e) {
          }
          set({ isConnecting: false });
        }, 1000);
        
        return;
      }
      
      set({ isConnecting: false });
      throw error;
    }
  },

  disconnect: async () => {
    try {
      const { disconnectWallet } = await import('@/lib/hashconnect');
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
      const { getAccountIds } = await import('@/lib/hashconnect');
      const connectedAccountIds = getAccountIds();
      
      if (connectedAccountIds && connectedAccountIds.includes(currentState.accountId)) {
        set({ isConnected: true });
      } else {
        set({ accountId: null, isConnected: false });
      }
    } catch (error) {
      set({ accountId: null, isConnected: false });
    }
  },

  forceReset: async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const { forceResetConnection } = await import('@/lib/hashconnect');
      await forceResetConnection();
      set({ accountId: null, isConnected: false, isConnecting: false });
    } catch (error) {
      console.error('Failed to force reset connection:', error);
      set({ accountId: null, isConnected: false, isConnecting: false });
    }
  },

  debugConnection: async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const { debugConnectionState } = await import('@/lib/hashconnect');
      debugConnectionState();
    } catch (error) {
      console.error('Failed to debug connection:', error);
    }
  },
});
