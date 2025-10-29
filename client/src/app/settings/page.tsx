'use client';

import React, { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AuthQueries } from '@/api/authQueries';
import TokenManager from '@/utils/cookies';
import { useAuthState } from '@/store';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { data, isLoading } = AuthQueries.useGetCurrentUser();
  const { setUser, setIsAuthenticated } = useAuthState();

  const user = data?.data?.user;

  const handleLogout = useCallback(async () => {
    TokenManager.removeTokens();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/');
  }, [router, setUser, setIsAuthenticated]);

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
        <h2 className="text-lg font-semibold mb-6">
          Connected Twitter Account
        </h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : user ? (
          <div className="flex flex-col items-center gap-3">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user.profile_image_url || ''}
                alt={user.name || 'Avatar'}
              />
              <AvatarFallback className="bg-gray-100">
                {(user.name || '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xl font-semibold">@{user.twitter_handle}</p>
            <p className="text-sm text-muted-foreground">{user.name}</p>
          </div>
        ) : (
          <p>No Twitter account linked.</p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium mb-4">Account Management</h3>

        <div className="space-y-3">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            Logout from TipJar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
