'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../lib/auth.store';
import BrandMark from './BrandMark';

// Thin-line icons (24px grid, stroke) to match the store's header icons
const ICONS: Record<string, string> = {
  dashboard: 'M4 13h6V4H4v9zm10 7h6V11h-6v9zM4 20h6v-4H4v4zm10-16v4h6V4h-6z',
  products: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
  categories: 'M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z',
  orders: 'M16 11V7a4 4 0 0 0-8 0v4M5 9h14l1 12H4L5 9z',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm11 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  coupons: 'M3 9a2 2 0 0 0 0 6v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-6V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v3zm11-4v14',
  banners: 'M4 5h16v14H4zM4 15l4-4 4 4 3-3 5 5M15 9h.01',
  reviews: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
};

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { href: '/products', label: 'Products', icon: 'products' },
  { href: '/categories', label: 'Categories', icon: 'categories' },
  { href: '/orders', label: 'Orders', icon: 'orders' },
  { href: '/users', label: 'Customers', icon: 'users' },
  { href: '/coupons', label: 'Coupons', icon: 'coupons' },
  { href: '/banners', label: 'Banners', icon: 'banners' },
  { href: '/reviews', label: 'Reviews', icon: 'reviews' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAdminAuthStore();

  const handleLogout = () => {
    clearAuth();
    router.push('/auth/login');
  };

  return (
    <aside className="w-64 h-screen sticky top-0 bg-sidebar border-r border-border flex flex-col shrink-0">
      <div className="px-6 pt-7 pb-6 border-b border-border flex flex-col items-center">
        <BrandMark className="h-[64px] w-auto" />
        <p className="eyebrow mt-3 !text-tertiary/70">Admin</p>
      </div>

      <nav className="flex-1 py-5 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-3.5 px-7 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                active ? 'text-primary bg-primary/[0.07]' : 'text-tertiary/80 hover:text-secondary hover:bg-white/[0.02]'
              }`}
            >
              {active && <span className="absolute left-0 top-2 bottom-2 w-[2px] bg-primary" />}
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                <path d={ICONS[icon]} />
              </svg>
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full border border-primary/50 flex items-center justify-center font-display text-lg text-primary">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="min-w-0">
            <p className="text-secondary text-sm truncate">{user?.name ?? 'Admin'}</p>
            <p className="text-tertiary/60 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-tertiary/70 hover:text-primary transition-colors">
          Sign out →
        </button>
      </div>
    </aside>
  );
}
