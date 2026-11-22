'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../lib/auth.store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAdminAuthStore();
  const router = useRouter();
  // The first client render uses the logged-out initial state; wait for the saved login to load before deciding.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const unsubscribe = useAdminAuthStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAdminAuthStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/auth/login');
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated) return null;
  return <>{children}</>;
}
