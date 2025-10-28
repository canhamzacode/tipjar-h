'use client';
import { TransferQueries } from '@/api/transferQueries';
import type { 
  InitiateTransferRequest, 
  InitiateTransferResponse,
  CompleteTransferRequest,
  CompleteTransferResponse 
} from '@/api/transferQueries';

/**
 * Hook for granular control over transfer operations
 * Use this when you need to handle each step manually
 */
export const useTransferMutations = () => {
  const initiateTransfer = TransferQueries.useInitiateTransfer();
  const completeTransfer = TransferQueries.useCompleteTransfer();

  /**
   * Step 1: Initiate a transfer
   */
  const initiate = async (request: InitiateTransferRequest): Promise<InitiateTransferResponse> => {
    const response = await initiateTransfer.mutateAsync(request);
    
    if (!response.success) {
      throw new Error('Failed to initiate transfer');
    }
    
    return response;
  };

  /**
   * Step 2: Sign transaction bytes with user's wallet
   */
  const sign = async (transactionBytes: string): Promise<string> => {
    try {
      const { signTransaction } = await import('@/lib/hashconnect');
      const signedBytes = await signTransaction(transactionBytes);
      return signedBytes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Transaction signing failed: ${errorMessage}`);
    }
  };

  /**
   * Step 3: Complete the transfer with signed transaction
   */
  const complete = async (request: CompleteTransferRequest): Promise<CompleteTransferResponse> => {
    const response = await completeTransfer.mutateAsync(request);
    
    if (!response.success) {
      throw new Error('Failed to complete transfer');
    }
    
    return response;
  };

  return {
    // Individual operations
    initiate,
    sign,
    complete,
    
    // Raw mutations for advanced use
    initiateTransfer,
    completeTransfer,
    
    // Loading states
    isInitiating: initiateTransfer.isPending,
    isCompleting: completeTransfer.isPending,
    isLoading: initiateTransfer.isPending || completeTransfer.isPending,
    
    // Errors
    initiateError: initiateTransfer.error,
    completeError: completeTransfer.error,
    
    // Reset functions
    resetInitiate: initiateTransfer.reset,
    resetComplete: completeTransfer.reset,
  };
};
