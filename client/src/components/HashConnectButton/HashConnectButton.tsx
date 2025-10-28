import { Wallet, Loader2 } from 'lucide-react';
import { useWalletState } from '@/store';
import { useWalletConnect } from '@/hooks';
import { Button } from '@/components/ui/button';

const HashConnectButton = () => {
  const { disconnect } = useWalletState();
  const { connect, isConnecting, accountId, isConnected, error } = useWalletConnect();

  const formatAccountId = (id: string) => {
    if (id.length <= 12) return id;
    return `${id.slice(0, 6)}...${id.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      // Error handling is done in the hook, but we can add UI feedback here if needed
      console.error('Connection failed in button:', error);
    }
  };

  if (isConnecting) {
    return (
      <Button variant="outline" disabled className="hidden sm:flex gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {error && error.message?.includes('Paired') ? 'Finalizing...' : 'Connecting...'}
      </Button>
    );
  }

  if (isConnected && accountId) {
    return (
      <div className="hidden sm:flex items-center gap-2">
        <div className="px-3 py-2 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm font-mono">
            {formatAccountId(accountId)}
          </span>
        </div>
        <Button variant="outline" size="sm" onClick={disconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleConnect}
      variant="outline"
      className="hidden sm:flex gap-2"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
};

export default HashConnectButton;
