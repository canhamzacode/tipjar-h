'use client'

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendTipSchema, type SendTipFormData } from '@/lib/validations/tip';
import { TransferQueries } from '@/api/transferQueries';
import { signTransaction } from '@/lib/hashconnect';
import { useWalletState } from '@/store';

interface UseQuickSendFormOptions {
  onSuccess?: (data: SendTipFormData) => void;
  onError?: (error: Error) => void;
}

export const useQuickSendForm = (options: UseQuickSendFormOptions = {}) => {
  const { onSuccess, onError } = options;
  const { isConnected } = useWalletState();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const initiateTransferMutation = TransferQueries.useInitiateTransfer();
  const completeTransferMutation = TransferQueries.useCompleteTransfer();

  const form = useForm<SendTipFormData>({
    resolver: zodResolver(sendTipSchema),
    defaultValues: {
      recipientHandle: '',
      amount: 5, // Default to $5
      note: '',
    },
  });

  const handleSubmit = async (data: SendTipFormData) => {
    if (!isConnected) {
      setError(new Error('Please connect your wallet first'));
      return;
    }

    if (isLoading) {
      // Prevent double submission
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSuccess(false);

    try {
      // Step 1: Initiate transfer (check if recipient exists)
      const response = await initiateTransferMutation.mutateAsync({
        receiverHandle: data.recipientHandle,
        amount: data.amount,
        token: 'HBAR',
      });

      if (response.type === 'pending') {
        // Scenario B: Recipient doesn't have wallet - tip is pending
        setSuccessMessage(`Tip pending! We'll notify @${data.recipientHandle} to connect their wallet.`);
        setIsSuccess(true);
        
        // Reset form
        form.reset({
          recipientHandle: '',
          amount: 5,
          note: '',
        });
        
        onSuccess?.(data);
      } else if (response.type === 'direct') {
        // Scenario A: Recipient has wallet - direct transfer
        const { transactionBytes, transactionId } = response.data;
        
        console.log('Starting transaction signing...', { transactionId });
        
        // Step 2: Sign transaction with user's wallet
        const signedTransactionBytes = await signTransaction(transactionBytes);
        
        console.log('Transaction signed, submitting to blockchain...', { transactionId });
        
        // Step 3: Complete transfer on blockchain
        const completeResponse = await completeTransferMutation.mutateAsync({
          transactionId,
          signedTransactionBytes,
        });
        
        console.log('Transaction completed successfully', { 
          transactionId, 
          txHash: completeResponse.data.txHash 
        });
        
        setSuccessMessage(`Tip sent successfully! Transaction: ${completeResponse.data.txHash}`);
        setIsSuccess(true);
        
        // Reset form
        form.reset({
          recipientHandle: '',
          amount: 5,
          note: '',
        });
        
        onSuccess?.(data);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to send tip');
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Failed to send tip:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    handleSubmit,
    isLoading,
    error,
    isSuccess,
    successMessage,
    reset: () => {
      form.reset();
      setError(null);
      setIsSuccess(false);
      setSuccessMessage('');
    },
  };
};
