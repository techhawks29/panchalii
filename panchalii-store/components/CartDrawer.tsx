'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '../lib/stores/cart.store';
import { errorMessage, inr } from '../lib/format';

const FREE_SHIPPING = 999;

export default function CartDrawer() {
  const { isOpen, closeCart, items, updateQty, removeItem, subtotal, itemCount } = useCartStore();
  const count = itemCount();
  const total = subtotal();

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeCart();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeCart]);

  if (!isOpen) return null;
  const safely = (fn: () => Promise<void>) => fn().catch((err) => toast.error(errorMessage(err)));

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-[60]" onClick={closeCart} aria-hidden="true" />
      <aside role="dialog" aria-modal="true" aria-label="Your bag" className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0F1A0F] border-l border-[rgba(201,169,110,0.25)] z-[61] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-7 py-6 border-b border-[rgba(201,169,110,0.2)]">
          <div>
            <p className="label-eyebrow">Your bag</p>
            <p className="font-display text-cream text-2xl mt-1">{count === 1 ? '1 piece' : `${count} pieces`}</p>
          </div>
          <button onClick={closeCart} className="text-cream-muted hover:text-gold text-3xl leading-none" aria-label="Close bag">×</button>
        </div>

        {items.length > 0 && (
          <div className="px-7 py-4 border-b border-[rgba(201,169,110,0.15)]">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cream-muted">
              {total >= FREE_SHIPPING ? <span className="text-gold">Complimentary shipping unlocked</span> : <>Add <span className="text-gold">{inr(FREE_SHIPPING - total)}</span> for complimentary shipping</>}
            </p>
            <div className="h-0.5 bg-[rgba(201,169,110,0.2)] mt-2.5"><div className="h-full bg-gold" style={{ width: `${Math.min(100, (total / FREE_SHIPPING) * 100)}%` }} /></div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-7">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-display text-cream text-3xl font-light">Your bag is empty</p>
              <p className="text-sm text-cream-muted mt-2">A story in every drape awaits you.</p>
              <Link href="/shop" onClick={closeCart} className="btn-secondary mt-8">Explore collections →</Link>
            </div>
          ) : (
            <ul>
              {items.map(({ product, qty }) => (
                <li key={product._id} className="flex gap-4 py-5 border-b border-[rgba(201,169,110,0.15)]">
                  <div className="relative w-[72px] h-24 shrink-0 bg-bg-card border border-[rgba(201,169,110,0.2)] overflow-hidden">
                    {product.images[0] && <Image src={product.images[0]} alt={product.name} fill sizes="72px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <Link href={`/shop/${product.slug}`} onClick={closeCart} className="flex-1 font-display text-cream text-lg leading-snug line-clamp-2 hover:text-gold">{product.name}</Link>
                      <button onClick={() => safely(() => removeItem(product._id))} className="text-cream-muted/60 hover:text-[#E5797D] text-lg leading-none" aria-label={`Remove ${product.name}`}>×</button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gold/50">
                        <button onClick={() => safely(() => (qty > 1 ? updateQty(product._id, qty - 1) : removeItem(product._id)))} className="w-8 h-8 text-gold text-sm" aria-label="Decrease quantity">−</button>
                        <span className="w-7 text-center text-sm text-cream">{qty}</span>
                        <button onClick={() => safely(() => updateQty(product._id, qty + 1))} disabled={qty >= 10} className="w-8 h-8 text-gold text-sm disabled:opacity-30" aria-label="Increase quantity">+</button>
                      </div>
                      <span className="text-sm text-cream">{inr(product.price * qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-[rgba(201,169,110,0.2)] px-7 py-6 space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold">Subtotal</span>
              <span className="font-display text-cream text-2xl leading-none">{inr(total)}</span>
            </div>
            <Link href="/checkout" onClick={closeCart} className="btn-secondary w-full h-12">Checkout →</Link>
            <Link href="/cart" onClick={closeCart} className="btn-primary w-full h-11">View bag</Link>
          </div>
        )}
      </aside>
    </>
  );
}
