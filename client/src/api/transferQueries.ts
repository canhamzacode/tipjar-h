import { useMutation, useQuery } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import { endpoints } from './endpoints';

// Types for transfer operations
export interface SendTipRequest {
  recipientHandle: string;
  amount: number;
  note?: string;
}

export interface TipActivity {
  id: string;
  recipientHandle: string;
  amount: number;
  note?: string;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: string;
}

export interface SendTipResponse {
  success: boolean;
  transactionId?: string;
  message: string;
}

export const TransferQueries = {
  // Send a tip mutation
  useSendTip: () =>
    useMutation<SendTipResponse, Error, SendTipRequest>({
      mutationKey: [endpoints.sendTip.key],
      mutationFn: async (data: SendTipRequest) => {
        const res = await apiClient.post(endpoints.sendTip.url, data);
        return res.data;
      },
    }),

  // Get recent tip activity
  useGetRecentActivity: () =>
    useQuery<TipActivity[]>({
      queryKey: [endpoints.getRecentActivity.key],
      queryFn: async () => {
        const res = await apiClient.get(endpoints.getRecentActivity.url);
        return res.data;
      },
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    }),

  // Get user balance
  useGetBalance: () =>
    useQuery<{ balance: number; currency: string }>({
      queryKey: [endpoints.getUserBalance.key],
      queryFn: async () => {
        const res = await apiClient.get(endpoints.getUserBalance.url);
        return res.data;
      },
    }),

  // Validate Twitter handle
  useValidateHandle: () =>
    useMutation<{ valid: boolean; exists: boolean }, Error, string>({
      mutationKey: [endpoints.validateHandle.key],
      mutationFn: async (handle: string) => {
        const res = await apiClient.post(endpoints.validateHandle.url, { handle });
        return res.data;
      },
    }),

  // Get tip history with pagination
  useGetTipHistory: (page = 1, limit = 20) =>
    useQuery<{ tips: TipActivity[]; total: number; hasMore: boolean }>({
      queryKey: [endpoints.getTipHistory.key, page, limit],
      queryFn: async () => {
        const res = await apiClient.get(`${endpoints.getTipHistory.url}?page=${page}&limit=${limit}`);
        return res.data;
      },
    }),

  // Get specific tip by ID
  useGetTipById: (tipId: string) =>
    useQuery<TipActivity>({
      queryKey: [endpoints.getTipById.key, tipId],
      queryFn: async () => {
        const res = await apiClient.get(`${endpoints.getTipById.url}/${tipId}`);
        return res.data;
      },
      enabled: !!tipId,
    }),

  // Cancel a pending tip
  useCancelTip: () =>
    useMutation<{ success: boolean; message: string }, Error, string>({
      mutationKey: [endpoints.cancelTip.key],
      mutationFn: async (tipId: string) => {
        const res = await apiClient.post(`${endpoints.cancelTip.url}/${tipId}`);
        return res.data;
      },
    }),

  // Retry a failed tip
  useRetryTip: () =>
    useMutation<SendTipResponse, Error, string>({
      mutationKey: [endpoints.retryTip.key],
      mutationFn: async (tipId: string) => {
        const res = await apiClient.post(`${endpoints.retryTip.url}/${tipId}`);
        return res.data;
      },
    }),
};
