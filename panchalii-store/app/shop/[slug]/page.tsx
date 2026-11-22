'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet } from '../../../lib/api';
import { useCartStore } from '../../../lib/stores/cart.store';
import { useWishlistToggle } from '../../../lib/account';
import { dateLabel, discountPercent, errorMessage, inr } from '../../../lib/format';
import { DiamondRule, EmptyState, Spinner, icons } from '../../../components/ui';

interface Product {
  _id: string; name: string; slug: string; price: number; mrp?: number; images: string[]; description?: string; details?: string;
  fabric?: string; weave?: string; occasion?: string[]; colour?: { name: string; hex: string }; inStock: boolean;
  averageRating?: number; totalReviews?: number; blousePiece?: boolean; length?: string;
  category?: { name: string; slug: string };
}
interface Review { _id?: string; user?: { name: string }; rating: number; title?: string; body?: string; createdAt: string }

function Stars({ value, className = '' }: { value: number; className?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${className}`} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => <span key={i} className={i < Math.round(value) ? 'text-gold' : 'text-gold/25'}>★</span>)}
    </span>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [imageIdx, setImageIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const wishlist = useWishlistToggle();

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => apiGet<{ data: Product }>(`/public/products/${slug}`).then((r) => r.data),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', product?._id],
    queryFn: () => apiGet<{ data: Review[] }>(`/public/reviews/${product!._id}`).then((r) => r.data || []),
    enabled: !!product?._id,
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-14">
        <div className="skeleton aspect-[3/4]" />
        <div className="space-y-4 pt-6"><div className="skeleton h-3 w-24" /><div className="skeleton h-12 w-3/4" /><div className="skeleton h-6 w-1/3" /><div className="skeleton h-40" /></div>
      </div>
    );
  }
  if (isError || !product) {
    return <EmptyState icon={icons.search} title="Saree not found" body="It may have sold out or moved." action={{ label: 'Back to the collection →', href: '/shop' }} />;
  }

  const discount = discountPercent(product.price, product.mrp);
  const saved = wishlist.isSaved(product._id);
  const images = product.images.length ? product.images : [''];

  const add = async () => {
    setAdding(true);
    try {
      await addItem(product._id, qty);
      toast.success(qty > 1 ? `Added ${qty} to your bag` : 'Added to your bag');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add to bag'));
    } finally {
      setAdding(false);
    }
  };

  const specs = [
    ['Fabric', product.fabric],
    ['Weave', product.weave],
    ['Colour', product.colour?.name],
    ['Occasion', product.occasion?.join(', ')],
    ['Length', product.length],
    ['Blouse piece', product.blousePiece ? 'Included' : undefined],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-6 py-8 md:py-12">
      <nav className="text-[10px] uppercase tracking-[0.2em] text-cream-muted mb-8" aria-label="Breadcrumb">
        <Link href="/shop" className="hover:text-gold">Shop</Link>
        {product.category && <> <span className="mx-2 text-gold/50">/</span><Link href={`/shop?category=${product.category.slug}`} className="hover:text-gold">{product.category.name}</Link></>}
      </nav>

      <div className="grid md:grid-cols-2 gap-10 md:gap-16">
        <div className="md:sticky md:top-28 md:self-start">
          <div className="relative aspect-[3/4] bg-bg-card border border-[rgba(201,169,110,0.2)] overflow-hidden">
            {images[imageIdx] && <Image src={images[imageIdx]} alt={product.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />}
            {discount > 0 && product.inStock && (
              <span className="absolute top-4 left-4 bg-gold text-[#0F1A0F] text-[10px] font-semibold uppercase tracking-[0.18em] px-3 py-1">{discount}% off</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 mt-3">
              {images.map((img, i) => (
                <button key={img + i} onClick={() => setImageIdx(i)} aria-label={`Image ${i + 1}`} aria-current={imageIdx === i} className={`relative w-20 h-24 border overflow-hidden ${imageIdx === i ? 'border-gold' : 'border-[rgba(201,169,110,0.25)] opacity-70 hover:opacity-100'}`}>
                  <Image src={img} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.fabric && <p className="label-eyebrow mb-4">{product.fabric}</p>}
          <h1 className="font-display font-light text-cream text-4xl md:text-5xl leading-tight">{product.name}</h1>

          {!!product.totalReviews && (
            <a href="#reviews" className="inline-flex items-center gap-2 mt-4 text-sm text-cream-muted hover:text-gold">
              <Stars value={product.averageRating ?? 0} /> {product.totalReviews} {product.totalReviews === 1 ? 'review' : 'reviews'}
            </a>
          )}

          <div className="flex items-baseline gap-3 mt-6">
            <span className="font-display text-cream text-4xl">{inr(product.price)}</span>
            {discount > 0 && <span className="text-cream-muted/60 line-through">{inr(product.mrp!)}</span>}
          </div>
          <p className="text-xs text-cream-muted/70 mt-1">Inclusive of all taxes · Free shipping above ₹999</p>

          <DiamondRule className="my-8 !justify-start" />

          {product.inStock ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.25em] text-cream-muted">Quantity</span>
                <div className="flex items-center border border-gold/50">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="w-11 h-11 text-gold disabled:opacity-30" aria-label="Decrease quantity">−</button>
                  <span className="w-10 text-center text-cream" aria-live="polite">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(10, q + 1))} disabled={qty >= 10} className="w-11 h-11 text-gold disabled:opacity-30" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={add} disabled={adding} className="btn-secondary flex-1 h-13 py-4">{adding ? <Spinner /> : 'Add to bag →'}</button>
                <button
                  onClick={() => wishlist.toggle(product)}
                  aria-pressed={saved}
                  aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                  className={`w-14 border flex items-center justify-center transition-colors ${saved ? 'border-gold bg-gold/10 text-gold' : 'border-gold/50 text-gold hover:bg-gold/10'}`}
                >
                  <svg className="w-5 h-5" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <div className="flex-1 border border-[rgba(201,169,110,0.3)] py-4 text-center text-[11px] uppercase tracking-[0.25em] text-cream-muted">Sold out</div>
              <button onClick={() => wishlist.toggle(product)} className="btn-primary">{saved ? 'Saved ♥' : 'Save for later'}</button>
            </div>
          )}

          {specs.length > 0 && (
            <section className="mt-12">
              <h2 className="label-eyebrow mb-4">The details</h2>
              <dl>
                {specs.map(([k, v]) => (
                  <div key={k} className="flex items-center gap-4 py-3 border-b border-[rgba(201,169,110,0.15)]">
                    <dt className="w-28 shrink-0 text-[10px] uppercase tracking-[0.2em] text-cream-muted/70">{k}</dt>
                    <dd className="font-display text-cream text-lg flex items-center gap-2">
                      {k === 'Colour' && product.colour?.hex && <span className="w-3 h-3 border border-[rgba(201,169,110,0.4)]" style={{ backgroundColor: product.colour.hex }} />}
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {product.description && (
            <section className="mt-10">
              <h2 className="label-eyebrow mb-4">The story</h2>
              <p className="text-cream-muted leading-relaxed">{product.description}</p>
              {product.details && <p className="text-sm text-cream-muted/70 leading-relaxed mt-3">{product.details}</p>}
            </section>
          )}

          <ul className="mt-10 grid sm:grid-cols-3 gap-px bg-[rgba(201,169,110,0.2)] border border-[rgba(201,169,110,0.2)]">
            {[['Free shipping', 'On orders above ₹999'], ['Authentic weave', 'Directly from weavers'], ['Easy returns', '7-day return policy']].map(([t, s]) => (
              <li key={t} className="bg-[#0F1A0F] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cream">{t}</p>
                <p className="text-xs text-cream-muted/70 mt-1">{s}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {reviews.length > 0 && (
        <section id="reviews" className="mt-24 scroll-mt-28">
          <div className="text-center mb-10">
            <p className="label-eyebrow mb-3">Loved by our patrons</p>
            <h2 className="font-display font-light text-cream text-4xl">Reviews</h2>
            <DiamondRule className="mt-4" />
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {reviews.map((r, i) => (
              <article key={r._id ?? i} className="bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] p-6">
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} />
                  <span className="text-xs text-cream-muted/60">{dateLabel(r.createdAt)}</span>
                </div>
                {r.title && <p className="font-display text-cream text-xl mt-3">{r.title}</p>}
                {r.body && <p className="text-sm text-cream-muted leading-relaxed mt-2">{r.body}</p>}
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold mt-4">{r.user?.name ?? 'A Panchalii patron'}</p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
