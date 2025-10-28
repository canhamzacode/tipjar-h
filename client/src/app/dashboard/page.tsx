'use client';

import React from 'react';
import {
  UserProfileCard,
  QuickSendTipForm,
  RecentActivityList,
} from '@/components';
import { AuthQueries } from '@/api/authQueries';
import { Loader2, AlertCircle } from 'lucide-react';
import type { UserProfile, TipFormData } from './types';

const DashboardPage = () => {
  const {
    data: currentUser,
    isLoading,
    error,
  } = AuthQueries.useGetCurrentUser();

  const handleTipSuccess = (data: TipFormData) => {
    console.log('Tip sent successfully:', data);
    // You can add toast notification here
  };

  const handleViewProfile = () => {
    // Open Twitter profile in new tab
    if (currentUser?.handle) {
      window.open(`https://twitter.com/${currentUser.handle}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !currentUser) {
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

  // Transform API user data to our UserProfile type
  const userProfile: UserProfile = {
    username: currentUser.name || currentUser.handle,
    handle: currentUser.handle,
    avatar:
      currentUser.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.handle}`,
    isConnected: true,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Send tips and track your activity</p>
        </div>

        {/* User Profile */}
        <div className="mb-8">
          <UserProfileCard
            user={userProfile}
            onViewProfile={handleViewProfile}
          />
        </div>

        <div className="grid gap-8">
          <div>
            <QuickSendTipForm onSuccess={handleTipSuccess} />
          </div>

          <div>
            <RecentActivityList />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
