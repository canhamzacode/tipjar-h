import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { User } from '@/types';

interface UserProfileCardProps {
  user: User;
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
          <AvatarImage
            src={user?.profile_image_url || ''}
            alt={user?.name || ''}
          />
          <AvatarFallback>
            {user?.name?.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-900">@{user?.name}</h3>
          <p className="text-sm text-gray-500">
            {user ? 'Connected Twitter Account' : 'Not Connected'}
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
