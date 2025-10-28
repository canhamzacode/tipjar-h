import type { StateCreator } from 'zustand';
// import { connectWallet, disconnectWallet } from '@/lib/hashconnect';

export type WalletState = {
  accountId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
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
      // Silent fail for disconnect
    }
  },
});
