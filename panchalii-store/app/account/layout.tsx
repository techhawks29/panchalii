'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useAuthReady } from '../../lib/useAuthReady';
import { Spinner } from '../../components/ui';

const NAV = [
  { href: '/account/profile', label: 'Overview' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/addresses', label: 'Addresses' },
  { href: '/account/notifications', label: 'Notifications' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const ready = useAuthReady();
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  useEffect(() => {
    if (ready && !isAuthenticated) router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
  }, [ready, isAuthenticated, pathname, router]);

  if (!ready || !isAuthenticated) {
    return <div className="min-h-[60vh] flex items-center justify-center text-gold"><Spinner className="w-6 h-6" /></div>;
  }

  const signOut = () => {
    clearAuth();
    qc.clear();
    router.push('/');
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-6 py-10 md:py-14 grid md:grid-cols-[220px_1fr] gap-8 md:gap-14">
      <aside className="md:sticky md:top-28 md:self-start">
        <div className="hidden md:block mb-8">
          <div className="w-14 h-14 rounded-full border border-gold/60 flex items-center justify-center font-display text-2xl text-gold">
            {user?.name?.[0]?.toUpperCase() ?? 'P'}
          </div>
          <p className="font-display text-cream text-xl mt-4 leading-tight">{user?.name}</p>
          <p className="text-xs text-cream-muted/70 mt-1 truncate">{user?.email}</p>
        </div>
        <nav className="flex md:flex-col gap-1 overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 border-b md:border-b-0 border-[rgba(201,169,110,0.2)]" aria-label="Account">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(`${n.href}/`);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`relative whitespace-nowrap px-1 md:px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  active ? 'text-gold md:bg-gold/[0.07]' : 'text-cream-muted/80 hover:text-cream'
                }`}
              >
                {active && <span className="absolute md:left-0 md:top-2 md:bottom-2 md:w-[2px] md:h-auto left-0 right-0 bottom-0 h-[2px] bg-gold" />}
                <span className="md:pl-0 px-2 md:px-0">{n.label}</span>
              </Link>
            );
          })}
          <button onClick={signOut} className="hidden md:block text-left px-4 py-3 mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5797D]/80 hover:text-[#E5797D] border-t border-[rgba(201,169,110,0.15)]">
            Sign out
          </button>
        </nav>
      </aside>
      <main className="min-w-0">
        {children}
        <button onClick={signOut} className="md:hidden mt-12 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#E5797D]/80">Sign out</button>
      </main>
    </div>
  );
}
