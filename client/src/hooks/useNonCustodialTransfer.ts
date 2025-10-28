'use client';
import { useCallback, useState } from 'react';
import { useWalletState } from '@/store';
import { TransferQueries } from '@/api/transferQueries';
import type { 
  InitiateTransferRequest, 
  PendingTipResponse, 
  DirectTransferResponse 
} from '@/api/transferQueries';

export interface TransferResult {
  type: 'pending' | 'direct';
  pendingTipId?: string;
  txHash?: string;
  message?: string;
}

export const useNonCustodialTransfer = () => {
  const { isConnected, accountId } = useWalletState();
  const initiateTransferMutation = TransferQueries.useInitiateTransfer();
  const completeTransferMutation = TransferQueries.useCompleteTransfer();
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);

  const executeTransfer = useCallback(async (transferData: InitiateTransferRequest): Promise<TransferResult> => {
    if (!isConnected || !accountId) {
      throw new Error('Wallet not connected. Please connect your wallet first.');
    }

    try {
      // Step 1: Initiate transfer on backend
      const initiateResponse = await initiateTransferMutation.mutateAsync(transferData);
      
      if (!initiateResponse.success) {
        throw new Error('Failed to initiate transfer');
      }

      // Handle pending tip case (receiver doesn't have wallet)
      if (initiateResponse.type === 'pending') {
        const pendingResponse = initiateResponse as PendingTipResponse;
        return {
          type: 'pending',
          pendingTipId: pendingResponse.data.pendingTipId,
          message: pendingResponse.data.message
        };
      }

      // Handle direct transfer case (receiver has wallet)
      const directResponse = initiateResponse as DirectTransferResponse;
      const { transactionId, transactionBytes } = directResponse.data;
      setCurrentTransactionId(transactionId);

      // Step 2: Sign transaction with user's wallet
      const { signTransaction } = await import('@/lib/hashconnect');
      const signedTransactionBytes = await signTransaction(transactionBytes);

      // Step 3: Complete transfer on backend
      const completeResponse = await completeTransferMutation.mutateAsync({
        transactionId,
        signedTransactionBytes,
      });

      if (!completeResponse.success) {
        throw new Error('Failed to complete transfer');
      }

      setCurrentTransactionId(null);
      return {
        type: 'direct',
        txHash: completeResponse.data.txHash
      };

    } catch (error) {
      setCurrentTransactionId(null);
      throw error;
    }
  }, [isConnected, accountId, initiateTransferMutation, completeTransferMutation]);

  return {
    executeTransfer,
    isInitiating: initiateTransferMutation.isPending,
    isCompleting: completeTransferMutation.isPending,
    isTransferring: initiateTransferMutation.isPending || completeTransferMutation.isPending,
    currentTransactionId,
    error: initiateTransferMutation.error || completeTransferMutation.error,
  };
};
