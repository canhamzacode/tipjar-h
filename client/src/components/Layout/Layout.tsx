'use client';
import { useGetCurrentUser, useWalletInit } from '@/hooks';
import React, { ReactNode } from 'react';
import { Navbar } from '../Navbar';

const Layout = ({ children }: { children: ReactNode }) => {
  const { isLoading } = useGetCurrentUser();
  useWalletInit(); // Initialize wallet state on app load

  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;
