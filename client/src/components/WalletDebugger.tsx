'use client';
import React from 'react';
import { useWalletState } from '@/store';

export const WalletDebugger: React.FC = () => {
  const { 
    accountId, 
    isConnected, 
    isConnecting, 
    connect, 
    disconnect, 
    forceReset, 
    debugConnection,
    rehydrateConnection
  } = useWalletState();

  return (
    <div className="p-4 border-2 border-red-300 bg-red-50 rounded-lg">
      <h3 className="text-lg font-bold text-red-800 mb-3">🔧 Wallet Debug Panel</h3>
      
      {/* Current State */}
      <div className="mb-4 p-3 bg-white rounded border">
        <h4 className="font-semibold mb-2">Current State:</h4>
        <div className="text-sm space-y-1">
          <div>Account ID: <code className="bg-gray-100 px-1 rounded">{accountId || 'None'}</code></div>
          <div>Connected: <span className={isConnected ? 'text-green-600' : 'text-red-600'}>{isConnected ? '✅ Yes' : '❌ No'}</span></div>
          <div>Connecting: <span className={isConnecting ? 'text-yellow-600' : 'text-gray-600'}>{isConnecting ? '⏳ Yes' : '⭕ No'}</span></div>
        </div>
        
        {/* Zustand Persist Info */}
        <div className="mt-2 pt-2 border-t">
          <div className="text-xs text-gray-600">
            <div>Zustand Persist: <span className="text-blue-600">✅ Enabled</span></div>
            <div>Storage Key: <code className="bg-gray-100 px-1 rounded text-xs">tipjar-app-storage</code></div>
          </div>
        </div>
      </div>

      {/* Debug Actions */}
      <div className="space-y-2">
        <button
          onClick={debugConnection}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔍 Debug Connection State
        </button>

        <button
          onClick={async () => {
            try {
              await rehydrateConnection();
              alert('Rehydration complete! Check console for details.');
            } catch (error) {
              console.error('Rehydration failed:', error);
              alert('Rehydration failed. Check console for details.');
            }
          }}
          className="w-full p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          🔄 Manual Rehydrate
        </button>

        <button
          onClick={async () => {
            try {
              await connect();
            } catch (error) {
              console.error('Connection failed:', error);
            //   alert(`Connection failed: `);
            }
          }}
          disabled={isConnecting}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          {isConnecting ? '⏳ Connecting...' : '🔗 Try Connect'}
        </button>

        <button
          onClick={async () => {
            try {
              await forceReset();
              alert('Connection state reset! Try connecting again.');
            } catch (error) {
              console.error('Reset failed:', error);
            }
          }}
          className="w-full p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          🔄 Force Reset Connection
        </button>

        <button
          onClick={disconnect}
          className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          🔌 Disconnect
        </button>
      </div>

      {/* Success Message */}
      {isConnected && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="font-semibold text-green-800 mb-2">✅ Wallet Connected Successfully!</h4>
          <p className="text-sm text-green-700">
            Your wallet is connected to account: <code className="bg-green-100 px-1 rounded">{accountId}</code>
          </p>
          <p className="text-sm text-green-600 mt-1">
            You can now use the transfer functionality. The "Paired" error you might have seen is normal - HashConnect sometimes shows this false positive.
          </p>
        </div>
      )}

      {/* Instructions */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-semibold text-yellow-800 mb-2">🚨 If stuck in loading:</h4>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Click "Debug Connection State" and check console</li>
            <li>2. Click "Force Reset Connection"</li>
            <li>3. Refresh the page</li>
            <li>4. Try "Try Connect" again</li>
            <li>5. Make sure you have a Hedera wallet extension installed</li>
          </ol>
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> If you see "❌ HashConnect error: Paired" in console, that's actually a success! 
              The connection should work despite this misleading error message.
            </p>
            <p className="text-xs text-blue-700 mt-1">
              <strong>After refresh:</strong> If wallet doesn't show as connected after page refresh, 
              try clicking "Manual Rehydrate" or just click the connect button once.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
