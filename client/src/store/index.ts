import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { createAuthSlice } from './userAuthSlice';
import { createWalletSlice, WalletState } from './useWalletSlice';

import type { AuthState } from './userAuthSlice';

type AppState = AuthState & WalletState;

const useAppState = create<AppState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createWalletSlice(...a),
    }),
    {
      name: 'tipjar-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist wallet state
        accountId: state.accountId,
        isConnected: state.isConnected,
        // Persist auth state for better UX (tokens are in httpOnly cookies anyway)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // Don't persist loading states
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accountId && state.rehydrateConnection) {
          setTimeout(() => state.rehydrateConnection(), 100);
        }
      },
    }
  )
);

const shallowEqual = <T extends object>(a: T, b: T): boolean => {
  const keysA = Object.keys(a) as (keyof T)[];
  const keysB = Object.keys(b) as (keyof T)[];

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => a[key] === b[key]);
};

const createSelector =
  <T extends object>() =>
  () => {
    let previousState: T | undefined;
    let previousResult: T | undefined;

    return useAppState((state) => {
      const nextState = { ...state } as T;

      if (
        previousState &&
        previousResult &&
        shallowEqual(nextState, previousState)
      ) {
        return previousResult;
      }

      previousState = nextState;
      previousResult = nextState;
      return nextState;
    });
  };

export const useAuthState = createSelector<AuthState>();

export const useWalletState = createSelector<WalletState>();
