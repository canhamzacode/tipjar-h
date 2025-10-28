'use client'
import { useEffect } from 'react';

import { useAuthState } from '@/store';
import { AuthQueries } from '@/api';

export const useGetCurrentUser = () => {
  const { setUser, setIsAuthenticated } = useAuthState();
  const { data: userData } = AuthQueries.useGetCurrentUser();

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
  }, [userData, setUser, setIsAuthenticated]);

  return { userData };
};
