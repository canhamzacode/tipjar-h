'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useWalletState, useAuthState } from '@/store';
import { WalletQueries } from '@/api/walletQueries';

export const useWalletConnect = () => {
  const {
    connect: connectWallet,
    accountId,
    isConnected,
    isConnecting,
  } = useWalletState();
  const { user } = useAuthState();
  const walletConnectMutation = WalletQueries.useWalletConnect();
  const lastProcessedAccountRef = useRef<string | null>(null);

  useEffect(() => {
    const handleWalletConnected = async () => {
      if (
        !accountId ||
        !isConnected ||
        !user ||
        lastProcessedAccountRef.current === accountId
      ) {
        return;
      }

      if (user.wallet_address !== accountId) {
        try {
          await walletConnectMutation.mutateAsync({
            walletAddress: accountId,
          });

          lastProcessedAccountRef.current = accountId;
        } catch (error) {
          console.error('Failed to associate wallet with user:', error);
        }
      } else {
        lastProcessedAccountRef.current = accountId;
      }
    };

    handleWalletConnected();
  }, [accountId, isConnected, user, walletConnectMutation]);

  const connect = useCallback(async () => {
    if (isConnecting) {
      return;
    }

    try {
      lastProcessedAccountRef.current = null;

      await connectWallet();
    } catch (error) {
      // Handle HashConnect "Paired" false positive
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Paired')) {
        // Don't throw the error, let the connection state update naturally
        return;
      }
      
      throw error;
    }
  }, [connectWallet, isConnecting]);

  return {
    connect,
    isConnecting: isConnecting || walletConnectMutation.isPending,
    error: walletConnectMutation.error,
    accountId,
    isConnected,
  };
};
