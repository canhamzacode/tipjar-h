'use client';
import { useEffect } from 'react';
import { useWalletState } from '@/store';

/**
 * Hook to initialize wallet connection state on app load
 * Now works with Zustand persist middleware for automatic rehydration
 */
export const useWalletInit = () => {
  const { accountId, isConnected, rehydrateConnection } = useWalletState();

  useEffect(() => {
    // Only validate connection if we have a persisted account but not connected state
    if (accountId && !isConnected) {
      const validateConnection = async () => {
        try {
          // Small delay to ensure HashConnect is loaded
          await new Promise(resolve => setTimeout(resolve, 1000));
          await rehydrateConnection();
        } catch (error) {
          // Silent error handling
        }
      };

      validateConnection();
    }
  }, [accountId, isConnected, rehydrateConnection]);
};
