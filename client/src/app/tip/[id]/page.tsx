'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function TipSignRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  useEffect(() => {
    if (id) router.replace(`/activity/${id}`);
  }, [id, router]);

  return <div className="p-6">Redirecting to activity details…</div>;
}
