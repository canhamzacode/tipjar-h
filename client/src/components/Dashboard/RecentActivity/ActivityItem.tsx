import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { TipActivity } from '@/app/dashboard/types';

interface ActivityItemProps {
  activity: TipActivity;
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

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarImage
            src={activity.recipientAvatar}
            alt={activity.recipientHandle}
          />
          <AvatarFallback className="bg-gray-100">
            {activity.recipientHandle.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 truncate">
              @{activity.recipientHandle}
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
              {activity.note}
            </p>
          )}

          <p className="text-xs text-gray-500 mt-1">
            {formatDate(activity.timestamp)}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-semibold text-gray-900">
          ${activity.amount.toFixed(2)}
        </p>
      </div>
    </div>
  );
};
