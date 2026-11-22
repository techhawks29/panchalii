'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCartStore } from '../lib/stores/cart.store';
import { useAuthStore } from '../lib/stores/auth.store';
import BrandMark from './BrandMark';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.itemCount)();
  const openCart = useCartStore((s) => s.openCart);
  const { isAuthenticated, user, clearAuth } = useAuthStore();

  const leftNav = [
    { label: 'Home', href: '/' },
    { label: 'Collections', href: '/shop' },
    { label: 'Silk', href: '/shop?category=silk' },
  ];
  const rightNav = [
    { label: 'New Arrivals', href: '/shop?sort=newest' },
    { label: 'Best Sellers', href: '/shop?featured=true' },
    { label: 'Our Story', href: '#' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0F1A0F] border-b border-[rgba(201,169,110,0.2)]">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        {/* Balances the mobile menu button so the logo stays centred */}
        <div className="md:hidden w-5 ml-4" aria-hidden="true" />
        {/* Left nav */}
        <nav className="entry-fade hidden md:flex items-center gap-8 flex-1">
          {leftNav.map((l) => (
            <Link key={l.href} href={l.href}
              className="text-[11px] font-body font-medium text-cream/70 hover:text-gold uppercase tracking-[0.2em] transition-colors whitespace-nowrap">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Centre logo — the entry curtain logo flies onto this element */}
        <Link href="/" className="flex-shrink-0 mx-8" data-entry-logo aria-label="Panchalii home">
          <BrandMark className="h-[54px] w-auto" />
        </Link>

        {/* Right nav + icons */}
        <div className="entry-fade hidden md:flex items-center gap-8 flex-1 justify-end">
          {rightNav.map((l) => (
            <Link key={l.href} href={l.href}
              className="text-[11px] font-body font-medium text-cream/70 hover:text-gold uppercase tracking-[0.2em] transition-colors whitespace-nowrap">
              {l.label}
            </Link>
          ))}

          {/* Icons */}
          <div className="flex items-center gap-5 ml-4 border-l border-[rgba(201,169,110,0.2)] pl-5">
            <Link href="/shop?q=" className="text-cream/60 hover:text-gold transition-colors" aria-label="Search">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>

            {isAuthenticated ? (
              <div className="relative group">
                <button className="text-cream/60 hover:text-gold transition-colors" aria-label="Account">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <div className="absolute right-0 top-8 w-48 bg-[#0F1A0F] border border-[rgba(201,169,110,0.3)] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="p-3 border-b border-[rgba(201,169,110,0.15)]">
                    <p className="text-xs font-body text-cream/60 uppercase tracking-widest truncate">{user?.name}</p>
                  </div>
                  {[['My Orders', '/account/orders'], ['Wishlist', '/account/wishlist'], ['Profile', '/account/profile']].map(([l, h]) => (
                    <Link key={h} href={h} className="block px-4 py-2.5 text-xs text-cream/60 hover:text-gold hover:bg-[#192619] uppercase tracking-widest font-body transition-colors">{l}</Link>
                  ))}
                  <button onClick={clearAuth} className="block w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-[#192619] uppercase tracking-widest font-body transition-colors">Logout</button>
                </div>
              </div>
            ) : (
              <Link href="/auth/login" className="text-cream/60 hover:text-gold transition-colors" aria-label="Login">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}

            {/* Wishlist */}
            <Link href="/account/wishlist" className="text-cream/60 hover:text-gold transition-colors" aria-label="Wishlist">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <button onClick={openCart} className="relative text-cream/60 hover:text-gold transition-colors" aria-label="Cart">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-gold text-bg-dark text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button className="entry-fade md:hidden text-cream/60 hover:text-gold ml-4" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[rgba(201,169,110,0.15)] bg-[#0F1A0F] px-6 py-6 flex flex-col gap-4">
          {[...leftNav, ...rightNav].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className="text-xs text-cream/60 hover:text-gold uppercase tracking-[0.2em] font-body transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-6 mt-2 pt-4 border-t border-[rgba(201,169,110,0.15)]">
            <button onClick={() => { openCart(); setMenuOpen(false); }} className="text-cream/60 hover:text-gold text-xs uppercase tracking-widest font-body">Cart ({itemCount})</button>
            {!isAuthenticated && <Link href="/auth/login" onClick={() => setMenuOpen(false)} className="text-cream/60 hover:text-gold text-xs uppercase tracking-widest font-body">Sign In</Link>}
          </div>
        </nav>
      )}
    </header>
  );
}
