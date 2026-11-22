'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from './stores/auth.store';

/** True once the saved login has been read from storage; before that, `isAuthenticated` is always false. */
export function useAuthReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const unsub = useAuthStore.persist.onFinishHydration(() => setReady(true));
    setReady(useAuthStore.persist.hasHydrated());
    return unsub;
  }, []);
  return ready;
}

/** Where to send someone after signing in: only same-site paths, never back to an auth page. */
export function safeNext(next: string | null | undefined) {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/auth')) return '/';
  return next;
}
