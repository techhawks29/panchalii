'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useCartStore } from '../lib/stores/cart.store';
import { useAuthStore } from '../lib/stores/auth.store';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <CartSync />
      {children}
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  );
}

// Keep the bag in step with the server (current names/prices, other devices).
function CartSync() {
  const signedIn = useAuthStore((s) => s.isAuthenticated);
  useEffect(() => {
    const load = () => useCartStore.getState().loadCart();
    load();
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [signedIn]);
  return null;
}
