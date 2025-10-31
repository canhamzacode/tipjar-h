'use client';
import { useGetCurrentUser, useWalletInit } from '@/hooks';
import React, { ReactNode } from 'react';
import { Navbar } from '../Navbar';

const Layout = ({ children }: { children: ReactNode }) => {
  useGetCurrentUser();
  useWalletInit();
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;
