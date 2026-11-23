'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCartStore } from '../../lib/stores/cart.store';
import { errorMessage, inr, piecesLabel } from '../../lib/format';
import { EmptyState, PageHeader, icons } from '../../components/ui';

const FREE_SHIPPING = 999;
const SHIPPING_FEE = 99;

export default function CartPage() {
  const { items, updateQty, removeItem, subtotal, itemCount, loadCart } = useCartStore();
  useEffect(() => { loadCart(); }, [loadCart]);
  const total = subtotal();
  const count = itemCount();
  const shipping = total >= FREE_SHIPPING ? 0 : SHIPPING_FEE;

  const safely = (fn: () => Promise<void>) => fn().catch((err) => toast.error(errorMessage(err)));

  if (!count) {
    return (
      <div className="py-10">
        <EmptyState icon={icons.bag} eyebrow="Your bag" title="Is empty" body="A story in every drape awaits you." action={{ label: 'Explore collections →', href: '/shop' }} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-6 py-12">
      <PageHeader eyebrow="Your bag" title="Shopping Bag" subtitle={piecesLabel(count)} />

      <div className="grid lg:grid-cols-[1fr_380px] gap-12">
        <div>
          <div className="mb-6 bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] px-5 py-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-cream-muted">
              {shipping === 0 ? <span className="text-gold">You have unlocked complimentary shipping</span> : <>Add <span className="text-gold">{inr(FREE_SHIPPING - total)}</span> more for complimentary shipping</>}
            </p>
            <div className="h-0.5 bg-[rgba(201,169,110,0.2)] mt-3"><div className="h-full bg-gold transition-all" style={{ width: `${Math.min(100, (total / FREE_SHIPPING) * 100)}%` }} /></div>
          </div>

          <ul className="border-t border-[rgba(201,169,110,0.15)]">
            {items.map(({ product, qty }) => (
              <li key={product._id} className="flex gap-5 py-6 border-b border-[rgba(201,169,110,0.15)]">
                <Link href={`/shop/${product.slug}`} className="relative w-24 h-32 shrink-0 bg-bg-card border border-[rgba(201,169,110,0.2)] overflow-hidden">
                  {product.images[0] && <Image src={product.images[0]} alt={product.name} fill sizes="96px" className="object-cover" />}
                </Link>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex items-start gap-3">
                    <Link href={`/shop/${product.slug}`} className="flex-1 font-display text-cream text-xl leading-snug hover:text-gold">{product.name}</Link>
                    <button onClick={() => safely(() => removeItem(product._id))} className="text-cream-muted/60 hover:text-[#E5797D] text-xl leading-none" aria-label={`Remove ${product.name}`}>×</button>
                  </div>
                  <p className="text-sm text-cream-muted mt-1">
                    {inr(product.price)}
                    {!!product.mrp && product.mrp > product.price && <span className="ml-2 text-cream-muted/50 line-through">{inr(product.mrp)}</span>}
                  </p>
                  <div className="flex items-center justify-between mt-auto pt-4">
                    <div className="flex items-center border border-gold/50">
                      <button onClick={() => safely(() => (qty > 1 ? updateQty(product._id, qty - 1) : removeItem(product._id)))} className="w-9 h-9 text-gold" aria-label="Decrease quantity">−</button>
                      <span className="w-9 text-center text-sm text-cream">{qty}</span>
                      <button onClick={() => safely(() => updateQty(product._id, qty + 1))} disabled={qty >= 10} className="w-9 h-9 text-gold disabled:opacity-30" aria-label="Increase quantity">+</button>
                    </div>
                    <p className="text-cream">{inr(product.price * qty)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/shop" className="inline-block mt-6 text-[10px] uppercase tracking-[0.2em] text-gold hover:text-gold-light">← Continue shopping</Link>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] p-7">
          <h2 className="font-display text-cream text-2xl mb-6">Order Summary</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between"><dt className="text-[10px] uppercase tracking-[0.2em] text-cream-muted self-center">Subtotal</dt><dd className="text-cream">{inr(total)}</dd></div>
            <div className="flex justify-between"><dt className="text-[10px] uppercase tracking-[0.2em] text-cream-muted self-center">Shipping</dt><dd className="text-cream">{shipping ? inr(shipping) : 'Complimentary'}</dd></div>
          </dl>
          <div className="flex items-end justify-between border-t border-[rgba(201,169,110,0.2)] mt-5 pt-5">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Total</span>
            <span className="font-display text-cream text-3xl leading-none">{inr(total + shipping)}</span>
          </div>
          <p className="text-right text-[11px] text-cream-muted/60 mt-1">Inclusive of all taxes · coupons at checkout</p>
          <Link href="/checkout" className="btn-secondary w-full h-12 mt-7">Proceed to checkout →</Link>
          <p className="text-center text-[9px] uppercase tracking-[0.2em] text-cream-muted/60 mt-4">Secure checkout via Razorpay</p>
        </aside>
      </div>
    </div>
  );
}
