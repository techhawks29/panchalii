'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import BrandMark from './BrandMark';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-screen bg-page">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-sidebar border-b border-border">
          <button
            onClick={() => setMenuOpen(true)}
            className="-ml-2 p-2 text-tertiary hover:text-primary"
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <BrandMark className="h-9 w-auto" />
          <span className="w-10" aria-hidden="true" />
        </header>

        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-10 lg:py-9">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
