'use client';

import React from 'react';
import { UserProfileCard, QuickSendTipForm } from '@/components';
import { AlertCircle } from 'lucide-react';
import type { TipFormData } from './types';
import { useAuthState } from '@/store';

const DashboardPage = () => {
  const { user, isAuthenticated } = useAuthState();

  const handleTipSuccess = (data: TipFormData) => {
    console.log('Tip sent successfully:', data);
  };

  const handleViewProfile = () => {
    if (user?.name) {
      window.open(`https://twitter.com/${user.name}`, '_blank');
    }
  };

  if (!user && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <p className="mt-2 text-gray-600">Failed to load user data</p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Send tips and track your activity</p>
        </div>

        <div className="mb-8">
          <UserProfileCard user={user} onViewProfile={handleViewProfile} />
        </div>

        <div className="grid gap-8">
          <div>
            <QuickSendTipForm onSuccess={handleTipSuccess} />
          </div>
          <div>{/* <RecentActivityList /> */}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
