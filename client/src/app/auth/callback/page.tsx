'use client';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { useEffect, useState, Suspense } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import TokenManager from '@/utils/cookies';

const AuthCallbackContent = () => {
  const searchParams = useSearchParams();
  const access_token = searchParams.get('access_token');
  const refresh_token = searchParams.get('refresh_token');
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );

  useEffect(() => {
    if (access_token || refresh_token) {
      try {
        TokenManager.setTokens({
          accessToken: access_token ?? null,
          refreshToken: refresh_token ?? null,
        });
        setStatus('success');
        setTimeout(() => router.replace('/'), 900);
      } catch (err) {
        console.error('Failed to persist tokens', err);
        setStatus('error');
      }
    } else {
      setStatus('error');
    }
  }, [access_token, refresh_token, router]);

  const STATUS_MAP: Record<
    typeof status,
    { title: string; message: string; Icon: React.ComponentType<{ className?: string }>; iconClass?: string }
  > = {
    loading: {
      title: 'Connecting your Twitter account…',
      message:
        'Please wait while we establish a secure connection with Twitter.',
      Icon: Loader2,
      iconClass: 'animate-spin text-blue-500',
    },
    success: {
      title: 'Connected — redirecting',
      message: 'You will be redirected shortly.',
      Icon: CheckCircle,
      iconClass: 'text-green-500',
    },
    error: {
      title: 'Connection failed',
      message:
        'Something went wrong. You can try reconnecting or contact support.',
      Icon: XCircle,
      iconClass: 'text-red-500',
    },
  };

  return (
    <div className="w-full h-screen  flex items-center justify-center">
      <div className="w-[523px] min-h-[320px] shadow rounded flex flex-col items-center justify-center gap-6 p-4 border">
        <div className="w-[100px] h-[100px] bg-primary/10 rounded-full flex items-center justify-center">
          {(() => {
            const { Icon, iconClass } = STATUS_MAP[status];
            return <Icon className={`h-8 w-8 ${iconClass || ''}`} />;
          })()}
        </div>

        <div className="w-[80%] flex flex-col gap-6 items-center text-center mx-auto">
          <h3 className="text-xl font-semibold">{STATUS_MAP[status].title}</h3>
          <p className="text-center text-slate-500">
            {STATUS_MAP[status].message}
          </p>
        </div>
      </div>
    </div>
  );
};

const AuthCallbackPage = () => {
  return (
    <Suspense fallback={
      <div className="w-full h-screen flex items-center justify-center">
        <div className="w-[523px] min-h-[320px] shadow rounded flex flex-col items-center justify-center gap-6 p-4 border">
          <div className="w-[100px] h-[100px] bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
          <div className="w-[80%] flex flex-col gap-6 items-center text-center mx-auto">
            <h3 className="text-xl font-semibold">Loading...</h3>
            <p className="text-center text-slate-500">Please wait while we process your authentication.</p>
          </div>
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
};

export default AuthCallbackPage;
