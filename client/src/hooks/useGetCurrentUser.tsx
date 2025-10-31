'use client';
import { useEffect } from 'react';

import { useAuthState } from '@/store';
import { AuthQueries } from '@/api';
import TokenManager from '@/utils/cookies';

export const useGetCurrentUser = () => {
  const { setUser, setIsAuthenticated } = useAuthState();
  const { data: userData, isLoading } = AuthQueries.useGetCurrentUser();
  const token = TokenManager.getAccessToken();

  useEffect(() => {
    if (userData?.data) {
      setUser(userData?.data?.user);
      setIsAuthenticated(true);
      return;
    }

    if (!userData) {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [userData, setUser, setIsAuthenticated, token]);

  return { userData, isLoading };
};
