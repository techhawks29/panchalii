'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useOrders } from '../../../lib/account';
import { dateLabel, inr, piecesLabel } from '../../../lib/format';
import { EmptyState, PageHeader, StatusBadge, icons } from '../../../components/ui';

export default function OrdersPage() {
  const { data: orders, isLoading, isError, refetch } = useOrders();

  return (
    <div>
      <PageHeader eyebrow="My orders" title="Your Orders" subtitle={orders?.length ? `${orders.length} ${orders.length === 1 ? 'order' : 'orders'}` : undefined} />

      {isLoading ? (
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-40" />)}</div>
      ) : isError ? (
        <EmptyState icon={icons.box} title="Couldn't load your orders" body="Check your connection and try again." action={{ label: 'Retry', onClick: () => refetch() }} />
      ) : !orders?.length ? (
        <EmptyState icon={icons.box} title="No orders yet" body="When you buy a saree, you can follow it here from our weavers to your door." action={{ label: 'Explore collections →', href: '/shop' }} />
      ) : (
        <div className="space-y-4">
          {orders.map((o) => {
            const first = o.items[0];
            const more = o.items.length - 1;
            const pieces = o.items.reduce((n, i) => n + i.qty, 0);
            const image = first?.image || (typeof first?.product === 'object' ? first.product.images?.[0] : undefined);
            return (
              <Link key={o._id} href={`/account/orders/${o._id}`} className="block bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] hover:border-gold/60 transition-colors group">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[rgba(201,169,110,0.15)]">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Order {o.orderNumber}</p>
                    <p className="text-xs text-cream-muted mt-1">Placed {dateLabel(o.createdAt)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <div className="flex items-center gap-5 p-5">
                  <div className="relative w-16 h-20 bg-bg-card border border-[rgba(201,169,110,0.2)] shrink-0 overflow-hidden">
                    {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-cream text-xl leading-snug line-clamp-2">{first?.name}</p>
                    {more > 0 && <p className="text-xs text-cream-muted mt-1">+ {more} more {more === 1 ? 'saree' : 'sarees'}</p>}
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cream-muted/80 mt-2">{piecesLabel(pieces)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-cream text-2xl">{inr(o.total)}</p>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold mt-2 group-hover:translate-x-0.5 transition-transform">Details →</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
