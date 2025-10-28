'use client';
import React, { useState } from 'react';
import { useNonCustodialTransfer, useTransferMutations } from '@/hooks';
import { useWalletState } from '@/store';

export const TransferExample: React.FC = () => {
  const { isConnected } = useWalletState();
  const [receiverHandle, setReceiverHandle] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  // Simple one-step transfer
  const { executeTransfer, isTransferring } = useNonCustodialTransfer();

  // Manual step-by-step transfer
  const { 
    initiate, 
    sign, 
    complete, 
    isInitiating, 
    isCompleting 
  } = useTransferMutations();

  const handleSimpleTransfer = async () => {
    if (!receiverHandle || !amount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setResult(null);

      const result = await executeTransfer({
        receiverHandle,
        amount: parseFloat(amount),
        token: 'HBAR'
      });

      setResult(result);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleManualTransfer = async () => {
    if (!receiverHandle || !amount) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setResult(null);

      // Step 1: Initiate transfer
      console.log('Step 1: Initiating transfer...');
      const initiateResponse = await initiate({
        receiverHandle,
        amount: parseFloat(amount),
        token: 'HBAR'
      });

      // Handle pending tip
      if (initiateResponse.type === 'pending') {
        setResult({
          type: 'pending',
          pendingTipId: initiateResponse.data.pendingTipId,
          message: initiateResponse.data.message
        });
        return;
      }

      // Handle direct transfer
      console.log('Step 2: Signing transaction...');
      const signedBytes = await sign(initiateResponse.data.transactionBytes);

      console.log('Step 3: Completing transfer...');
      const completeResponse = await complete({
        transactionId: initiateResponse.data.transactionId,
        signedTransactionBytes: signedBytes
      });

      setResult({
        type: 'direct',
        txHash: completeResponse.data.txHash
      });

    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isConnected) {
    return (
      <div className="w-full max-w-md p-4 border rounded">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p>⚠️ Please connect your wallet to send transfers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-md">
      {/* Input Form */}
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-4">Send HBAR Transfer</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Receiver Handle</label>
            <input
              className="w-full p-2 border rounded"
              placeholder="@username"
              value={receiverHandle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReceiverHandle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Amount (HBAR)</label>
            <input
              className="w-full p-2 border rounded"
              type="number"
              placeholder="10"
              value={amount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <button 
              onClick={handleSimpleTransfer}
              disabled={isTransferring}
              className="w-full p-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              {isTransferring ? 'Processing Transfer...' : 'Send Transfer (Simple)'}
            </button>

            <button 
              onClick={handleManualTransfer}
              disabled={isInitiating || isCompleting}
              className="w-full p-2 border border-blue-500 text-blue-500 rounded disabled:opacity-50"
            >
              {isInitiating || isCompleting ? 
                (isInitiating ? 'Initiating...' : 'Completing...') : 
                'Send Transfer (Manual Steps)'
              }
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="p-4 border rounded">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            {result.type === 'pending' ? (
              <>🕐 Pending Tip Created</>
            ) : (
              <>✅ Transfer Completed</>
            )}
          </h4>
          
          {result.type === 'pending' ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">{result.message}</p>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded">
                Pending Tip ID: {result.pendingTipId}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Transaction successfully submitted to Hedera network.
              </p>
              <p className="text-xs font-mono bg-gray-100 p-2 rounded break-all">
                Transaction Hash: {result.txHash}
              </p>
              <a
                href={`https://hashscan.io/testnet/transaction/${result.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm"
              >
                View on HashScan →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
