import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import type { UserProfile } from '@/app/dashboard/types';

interface UserProfileCardProps {
  user: UserProfile;
  onViewProfile?: () => void;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  user,
  onViewProfile,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback>
            {user.username?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-900">@{user.handle}</h3>
          <p className="text-sm text-gray-500">
            {user.isConnected ? 'Connected Twitter Account' : 'Not Connected'}
          </p>
        </div>
      </div>

      {onViewProfile && (
        <Button
          size="sm"
          onClick={onViewProfile}
          className="flex items-center gap-2"
        >
          View Profile
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
