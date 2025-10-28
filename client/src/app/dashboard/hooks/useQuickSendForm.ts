'use client'

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { sendTipSchema, type SendTipFormData } from '@/lib/validations/tip';
import { TransferQueries } from '@/api/transferQueries';

interface UseQuickSendFormOptions {
  onSuccess?: (data: SendTipFormData) => void;
  onError?: (error: Error) => void;
}

export const useQuickSendForm = (options: UseQuickSendFormOptions = {}) => {
  const { onSuccess, onError } = options;
  const sendTipMutation = TransferQueries.useSendTip();

  const form = useForm<SendTipFormData>({
    resolver: zodResolver(sendTipSchema),
    defaultValues: {
      recipientHandle: '',
      amount: 5, // Default to $5
      note: '',
    },
  });

  const handleSubmit = async (data: SendTipFormData) => {
    try {
      await sendTipMutation.mutateAsync({
        recipientHandle: data.recipientHandle,
        amount: data.amount,
        note: data.note,
      });
      
      // Reset form on success
      form.reset({
        recipientHandle: '',
        amount: 5,
        note: '',
      });
      
      onSuccess?.(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error : new Error('Failed to send tip');
      onError?.(errorMessage);
      console.error('Failed to send tip:', error);
    }
  };

  return {
    form,
    handleSubmit,
    isLoading: sendTipMutation.isPending,
    error: sendTipMutation.error,
    isSuccess: sendTipMutation.isSuccess,
    reset: () => form.reset(),
  };
};
