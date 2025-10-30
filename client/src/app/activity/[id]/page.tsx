'use client';
import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  TransferQueries,
  GetTransferByIdResponse,
} from '@/api/transferQueries';
import { apiClient } from '@/api/apiClient';
import { CompleteTransferRequest } from '@/api/transferQueries';
import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useWalletState } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import { endpoints } from '@/api/endpoints';

export default function ActivityDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const { data, isLoading, error } = TransferQueries.useGetTransferById(id);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error)
    return <div className="p-6 text-red-600">Error: {error.message}</div>;

  const tx = data?.data as GetTransferByIdResponse['data'] & {
    counterparty?: {
      id: string;
      twitter_handle: string;
      name: string;
      profile_image_url: string;
    } | null;
  };

  if (!tx) return <div className="p-6">No transaction found.</div>;
  const counterparty = tx.counterparty || null;

  return (
    <div className="max-w-[900px] mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Activity detail</h2>

      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage
                src={counterparty?.profile_image_url || ''}
                alt={counterparty?.name || 'Avatar'}
              />
              <AvatarFallback className="bg-gray-100">
                {counterparty?.name?.slice(0, 2).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div>
              <p className="font-medium text-gray-900 truncate">
                @
                {counterparty?.twitter_handle ||
                  counterparty?.name ||
                  'Unknown'}
              </p>
              <p className="text-sm text-gray-500 mt-1">{tx.note ?? ''}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-semibold text-gray-900">
              HBAR {Number(tx?.amount ?? 0).toFixed(2)}
            </p>
            {tx.txHash ? (
              <a
                href={`https://hashscan.io/testnet/transaction/${tx.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary"
              >
                View on HashScan
              </a>
            ) : (
              <div className="text-sm text-gray-500 mt-1">{tx.status}</div>
            )}
          </div>
        </div>

        <div className="mt-4 border-t pt-4">
          <div className="text-sm text-gray-600 mb-2">
            <strong>Transaction ID:</strong> {tx.transactionId}
          </div>

          {tx.unsignedTransaction ? (
            <SigningBlock tx={tx} />
          ) : (
            <div className="mt-2 text-sm text-gray-600">
              No signature required or already processed.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <Link href="/activity" className="text-primary underline">
          ← Back to activity
        </Link>
      </div>
    </div>
  );
}

function SigningBlock({
  tx,
}: {
  tx: GetTransferByIdResponse['data'] & {
    unsignedTransaction?: {
      transactionBytes?: string;
      senderAccountId?: string;
      receiverAccountId?: string;
      amount?: number;
      token?: string;
    } | null;
  };
}) {
  const [busy, setBusy] = useState(false);
  const { accountId, isConnected, connect } = useWalletState();
  const queryClient = useQueryClient();

  const unsigned = tx.unsignedTransaction;

  const handleSignAndSubmit = async () => {
    if (!tx.transactionId) return;

    if (!isConnected || !accountId) {
      try {
        await connect();
      } catch (connectErr) {
        console.error('Wallet connect failed', connectErr);
        alert('Please connect your wallet before signing');
        return;
      }
    }

    // Optional: check sender matches connected account
    if (
      unsigned?.senderAccountId &&
      accountId &&
      unsigned.senderAccountId !== accountId
    ) {
      const proceed = confirm(
        `Connected wallet (${accountId}) does not match the sender account (${unsigned.senderAccountId}). Continue?`
      );
      if (!proceed) return;
    }

    setBusy(true);
    try {
      if (!unsigned || !unsigned.transactionBytes) {
        alert('Unsigned transaction is not available');
        setBusy(false);
        return;
      }
      const { signTransaction } = await import('@/lib/hashconnect');

      const signedBytes = await signTransaction(unsigned.transactionBytes);

      const body: CompleteTransferRequest = {
        transactionId: tx.transactionId,
        signedTransactionBytes: signedBytes,
      };

      await apiClient.post('/transfer/complete', body);

      await queryClient.invalidateQueries({
        queryKey: [endpoints.getTransferById.key, tx.transactionId],
      });
      await queryClient.invalidateQueries({
        queryKey: [endpoints.getUserTransactions.key],
      });
    } catch {
      alert(`Failed to submit signed transaction`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 p-3 border rounded">
      <p className="mb-2">This transfer requires your signature.</p>
      <div className="mb-2">
        <strong>Sender:</strong> {unsigned?.senderAccountId}
      </div>
      <div className="mb-2">
        <strong>Receiver:</strong> {unsigned?.receiverAccountId}
      </div>
      <div className="mb-4">
        <strong>Amount:</strong> {unsigned?.amount} {unsigned?.token}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSignAndSubmit}
          disabled={busy}
          className="bg-primary text-white px-4 py-2 rounded cursor-pointer"
        >
          {busy ? 'Submitting...' : 'Sign & Submit'}
        </button>

        {/* <Link
          href={`/activity/${tx.transactionId}`}
          className="px-4 py-2 rounded border !text-primary"
        >
          Back to details
        </Link> */}
      </div>
    </div>
  );
}
