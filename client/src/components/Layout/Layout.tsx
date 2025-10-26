'use client';
import { useGetCurrentUser } from '@/hooks';
import React, { ReactNode } from 'react';

const Layout = ({ children }: { children: ReactNode }) => {
  useGetCurrentUser();
  return <div>{children}</div>;
};

export default Layout;
