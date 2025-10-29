'use client';

import React from 'react';
import { ActivityItem } from './ActivityItem';
import { TransferQueries } from '@/api/transferQueries';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const RecentActivityList = ({
  showViewAllLink = true,
  numberOfItems,
  showTitle = true,
}: {
  showViewAllLink?: boolean;
  numberOfItems?: number;
  showTitle?: boolean;
}) => {
  const {
    data: activities,
    isLoading,
    error,
  } = TransferQueries.useGetAllTransactions();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Tip Activity
        </h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-600">Loading activities...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Tip Activity
        </h2>
        <div className="flex items-center justify-center py-8 text-red-600">
          <AlertCircle className="h-6 w-6" />
          <span className="ml-2">Failed to load activities</span>
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Tip Activity
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-600">No tip activity yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Your recent tips will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      {showTitle && (
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Tip Activity
          </h2>
          {showViewAllLink && (
            <Link href="/activity" className="text-sm text-primary">
              View All
            </Link>
          )}
        </div>
      )}

      <div className="divide-y divide-gray-100">
        {activities?.slice(0, numberOfItems)?.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
};
