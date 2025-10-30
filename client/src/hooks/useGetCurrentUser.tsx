'use client';
import { useEffect } from 'react';

import { useAuthState } from '@/store';
import { AuthQueries } from '@/api';
import TokenManager from '@/utils/cookies';

export const useGetCurrentUser = () => {
  const { setUser, setIsAuthenticated, setAuthLoading, isAuthLoading } = useAuthState();
  const { data: userData, isLoading, error } = AuthQueries.useGetCurrentUser();
  const token = TokenManager.getAccessToken();

  useEffect(() => {
    if (userData?.data) {
      setUser(userData?.data?.user);
      setIsAuthenticated(true);
      setAuthLoading(false);
    } else if (error || (!userData && !isLoading)) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthLoading(false);
    }
  }, [userData, isLoading, error, setUser, setIsAuthenticated, setAuthLoading]);

  // Handle auth loading state when query starts loading
  useEffect(() => {
    if (isLoading && token && !isAuthLoading) {
      setAuthLoading(true);
    }
  }, [isLoading, token, isAuthLoading, setAuthLoading]);

  return { userData, isLoading: isLoading || isAuthLoading };
};
