'use client';
import { useGetCurrentUser, useWalletInit } from '@/hooks';
import React, { ReactNode } from 'react';
import { Navbar } from '../Navbar';
import { useAuthState } from '@/store';
import { Loader2 } from 'lucide-react';

const Layout = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useGetCurrentUser();
  const { isAuthLoading } = useAuthState();
  useWalletInit();

  // Show loading screen during authentication
  if (isAuthLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="text-slate-600">Completing authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;
