'use client';
import { useGetCurrentUser } from '@/hooks';
import React, { ReactNode } from 'react';
import { Navbar } from '../Navbar';

const Layout = ({ children }: { children: ReactNode }) => {
  useGetCurrentUser();
  return (
    <div>
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;
