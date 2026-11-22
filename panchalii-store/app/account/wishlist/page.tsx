'use client';
import { useWishlist } from '../../../lib/account';
import ProductCard from '../../../components/ProductCard';
import SkeletonCard from '../../../components/SkeletonCard';
import { EmptyState, PageHeader, icons } from '../../../components/ui';

export default function WishlistPage() {
  const { data: products, isLoading, isError, refetch } = useWishlist();

  return (
    <div>
      <PageHeader
        eyebrow="Saved for later"
        title="Your Wishlist"
        subtitle={products?.length ? `${products.length} ${products.length === 1 ? 'saree' : 'sarees'}` : undefined}
      />
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}</div>
      ) : isError ? (
        <EmptyState icon={icons.heart} title="Couldn't load your wishlist" body="Check your connection and try again." action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : !products?.length ? (
        <EmptyState icon={icons.heart} title="Nothing saved yet" body="Tap the heart on any saree to keep it here for later." action={{ label: 'Explore collections →', href: '/shop' }} />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-10">
          {products.map((p) => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
