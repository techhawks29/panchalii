'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '../lib/stores/cart.store';
import { useWishlistToggle } from '../lib/account';
import { discountPercent, errorMessage, inr } from '../lib/format';
import { toast } from 'sonner';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  mrp?: number;
  images: string[];
  colour?: { name: string; hex: string };
  fabric?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock?: boolean;
  averageRating?: number;
  totalReviews?: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const wishlist = useWishlistToggle();
  const saved = wishlist.isSaved(product._id);
  const soldOut = product.inStock === false;
  const discount = discountPercent(product.price, product.mrp);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await addItem(product._id);
      toast.success('Added to bag');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not add to bag'));
    }
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    wishlist.toggle(product);
  };

  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <div className="relative overflow-hidden bg-[#1E301E] aspect-[3/4]">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#2A3D2A] to-[#0F1A0F]" />
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.isNew && !soldOut && <span className="bg-gold text-bg-dark text-[9px] font-body uppercase tracking-widest px-2 py-0.5">New</span>}
          {discount > 0 && !soldOut && <span className="bg-[#0F1A0F]/85 border border-gold/50 text-gold text-[9px] font-body uppercase tracking-widest px-2 py-0.5">{discount}% off</span>}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full bg-[#0F1A0F]/80 border flex items-center justify-center transition-opacity hover:border-gold focus-visible:opacity-100 ${saved ? 'opacity-100 border-gold/70' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 border-[rgba(201,169,110,0.3)]'}`}
          aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={saved}
        >
          <svg className="w-3.5 h-3.5 text-gold" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {soldOut ? (
          <div className="absolute inset-0 bg-[#0F1A0F]/55 flex items-center justify-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-cream">Sold out</span>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-300">
            <button onClick={handleAddToCart}
              className="w-full bg-[#0F1A0F]/90 text-gold border-t border-[rgba(201,169,110,0.4)] text-[10px] font-body uppercase tracking-[0.2em] py-3 hover:bg-gold hover:text-bg-dark transition-colors">
              Add to Bag
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-1 px-0.5">
        {product.fabric && <p className="text-[9px] text-gold/60 uppercase tracking-[0.2em] font-body">{product.fabric}</p>}
        <h3 className="text-base md:text-lg font-display text-cream line-clamp-2 group-hover:text-gold transition-colors leading-snug">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-body text-cream/85">{inr(product.price)}</span>
          {discount > 0 && <span className="text-xs text-cream/35 font-body line-through">{inr(product.mrp!)}</span>}
        </div>
        {product.colour && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2.5 h-2.5 border border-[rgba(201,169,110,0.3)]" style={{ backgroundColor: product.colour.hex }} />
            <span className="text-[9px] text-cream/40 font-body uppercase tracking-widest">{product.colour.name}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
