import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './apiClient';
import { endpoints } from './endpoints';

interface WalletConnectData {
  walletAddress: string;
}

export const WalletQueries = {
  useWalletConnect: () => {
    const queryClient = useQueryClient();

    return useMutation({
      mutationKey: [endpoints.walletConnect.key],
      mutationFn: async (data: WalletConnectData) => {
        const res = await apiClient.post(endpoints.walletConnect.url, data);
        return res.data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [endpoints.getCurrentUser.key],
        });
      },
    });
  },
};
