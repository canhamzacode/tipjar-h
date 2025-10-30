import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { TipActivity } from '@/app/dashboard/types';
import { ITransaction } from '@/api/transferQueries';
import Link from 'next/link';

interface ActivityItemProps {
  activity: ITransaction;
}

const statusConfig = {
  confirmed: {
    label: 'Confirmed',
    className: 'bg-green-100 text-green-800 border-green-200',
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 border-red-200',
  },
};

export const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const status = statusConfig[activity.status];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text?: string, max = 100) => {
    if (!text) return '';
    return text.length > max ? `${text.slice(0, max - 3)}...` : text;
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={activity.counterparty?.profile_image_url || ''}
            alt={activity.counterparty?.name || 'User Avatar'}
          />
          <AvatarFallback className="bg-gray-100">
            {activity.counterparty?.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">
              @{activity.counterparty?.twitter_handle || 'Unknown User'}
            </p>
            <span
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full border',
                status.className
              )}
            >
              {status.label}
            </span>
          </div>

          {activity.note && (
            <p className="text-sm text-gray-600 mt-1 truncate">
              {truncateText(activity.note, 100)}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            {formatDate(activity.created_at?.toString() || '')}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold text-gray-900">
          HBAR {Number(activity?.amount ?? 0).toFixed(2)}
        </p>
        <Link
          href={`https://hashscan.io/testnet/transaction/${activity.tx_hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary"
        >
          View on HashScan
        </Link>
        <div className="mt-2">
          <Link
            href={`/activity/${activity.id}`}
            className="text-sm text-primary"
          >
            View details
          </Link>
        </div>
      </div>
    </div>
  );
};
