import { useMutation, useQuery } from '@tanstack/react-query';
import { endpoints } from './endpoints';
import { apiClient } from './apiClient';
import TokenManager from '@/utils/cookies';

export const AuthQueries = {
  useInitateTwitterOath: () =>
    useMutation({
      mutationKey: [endpoints.initiateTwitterLogin.key],
      mutationFn: async () => {
        const res = await apiClient.get(endpoints.initiateTwitterLogin.url);

        return res.data;
      },
    }),
  useGetCurrentUser: () => {
    const token = TokenManager.getAccessToken();

    return useQuery({
      queryKey: [endpoints.getCurrentUser.key, token],
      queryFn: async () => {
        const res = await apiClient.get(endpoints.getCurrentUser.url);
        return res.data;
      },
      enabled: !!token,
      retry: false,
    });
  },

  useRefreshUserToken: () =>
    useMutation({
      mutationKey: [endpoints.refreshUserToken.key],
      mutationFn: async () => {
        const res = await apiClient.post(endpoints.refreshUserToken.url);
        return res.data;
      },
    }),
};
