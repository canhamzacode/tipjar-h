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

// New non-custodial transfer types
export interface InitiateTransferRequest {
  receiverHandle: string;
  amount: number;
  token?: string;
  note?: string;
}

export interface PendingTipResponse {
  success: boolean;
  type: 'pending';
  data: {
    pendingTipId: string;
    message: string;
  };
}

export interface DirectTransferResponse {
  success: boolean;
  type: 'direct';
  data: {
    transactionId: string;
    transactionBytes: string;
    senderAccountId: string;
    receiverAccountId: string;
    amount: number;
    token: string;
  };
}

export type InitiateTransferResponse =
  | PendingTipResponse
  | DirectTransferResponse;

export interface CompleteTransferRequest {
  transactionId: string;
  signedTransactionBytes: string;
}

export interface CompleteTransferResponse {
  success: boolean;
  data: {
    transactionId: string;
    txHash: string;
    status: string;
  };
}

export interface ITransaction {
  id: string;
  direction: string;
  amount: string | null;
  token: string | null;
  tx_hash: string | null;
  status: 'pending' | 'confirmed' | 'failed';
  created_at: string | null;
  note: string | null;
  counterparty: {
    id: string;
    twitter_handle: string;
    name: string;
    profile_image_url: string;
  } | null;
  // Unsigned transaction for pending non-custodial transfers. May be null when
  // the tip has already been processed or one of the wallets is missing.
  unsignedTransaction?: {
    transactionBytes?: string;
    senderAccountId?: string;
    receiverAccountId?: string;
    amount?: number;
    token?: string;
  } | null;
}

export interface GetTransferByIdResponse {
  success: boolean;
  data: {
    transactionId: string;
    status: 'pending' | 'confirmed' | 'failed';
    txHash?: string | null;
    amount?: number | string | null;
    token?: string | null;
    note?: string | null;
    created_at?: string | null;
    unsignedTransaction?: {
      transactionBytes: string;
      senderAccountId: string;
      receiverAccountId: string;
      amount: number;
      token: string;
    } | null;
  };
}

export const TransferQueries = {
  useGetAllTransactions: () =>
    useQuery({
      queryKey: [endpoints.getUserTransactions.key],
      queryFn: async () => {
        const res = await apiClient.get(endpoints.getUserTransactions.url);
        return (
          (res.data.transactions as ITransaction[]) || ([] as ITransaction[])
        );
      },
    }),

  useGetTransferById: (id: string) =>
    useQuery({
      queryKey: [endpoints.getTransferById.key, id],
      queryFn: async () => {
        const res = await apiClient.get(endpoints.getTransferById.url(id));
        return res.data as GetTransferByIdResponse;
      },
      enabled: Boolean(id),
    }),

  // Non-custodial transfer mutations
  useInitiateTransfer: () =>
    useMutation<InitiateTransferResponse, Error, InitiateTransferRequest>({
      mutationKey: [endpoints.initiateTransfer.key],
      mutationFn: async (data: InitiateTransferRequest) => {
        const res = await apiClient.post(endpoints.initiateTransfer.url, data);
        return res.data;
      },
    }),

  useCompleteTransfer: () =>
    useMutation<CompleteTransferResponse, Error, CompleteTransferRequest>({
      mutationKey: [endpoints.completeTransfer.key],
      mutationFn: async (data: CompleteTransferRequest) => {
        const res = await apiClient.post(endpoints.completeTransfer.url, data);
        return res.data;
      },
    }),
};
