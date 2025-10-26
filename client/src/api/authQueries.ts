import { useMutation, useQuery } from '@tanstack/react-query';
import { endpoints } from './endpoints';
import { apiClient } from './apiClient';

export const AuthQueries = {
  useInitateTwitterOath: () =>
    useMutation({
      mutationKey: [endpoints.initiateTwitterLogin.key],
      mutationFn: async () => {
        const res = await apiClient.get(endpoints.initiateTwitterLogin.url);

        return res.data;
      },
    }),
  useGetCurrentUser: () =>
    useQuery({
      queryKey: [endpoints.getCurrentUser.key],
      queryFn: async () => {
        const res = await apiClient.get(endpoints.getCurrentUser.url);

        return res.data;
      },
    }),
  useRefreshUserToken: () =>
    useMutation({
      mutationKey: [endpoints.refreshUserToken.key],
      mutationFn: async (data: { refresh_token: string }) => {
        const res = await apiClient.post(endpoints.refreshUserToken.url);
        return res.data;
      },
    }),
};
