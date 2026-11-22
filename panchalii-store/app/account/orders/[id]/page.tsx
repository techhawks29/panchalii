'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { addressLines, useOrder, type Order } from '../../../../lib/account';
import { dateLabel, dateTimeLabel, inr, piecesLabel } from '../../../../lib/format';
import { EmptyState, SectionTitle, StatusBadge, icons, statusStyle } from '../../../../components/ui';

const SUPPORT = 'hello@panchalii.in';

const HEADLINES: Record<string, string> = {
  pending: 'Awaiting payment',
  confirmed: 'Your order is confirmed',
  processing: 'Being prepared for you',
  shipped: 'On its way to you',
  delivered: 'Delivered with love',
  cancelled: 'This order was cancelled',
  refunded: 'This order was refunded',
};

const STEPS = [
  { key: 'placed', label: 'Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const reachedIndex = (status: string) => ({ confirmed: 1, processing: 1, shipped: 2, delivered: 3 } as Record<string, number>)[status] ?? 0;

function stepDate(o: Order, key: string) {
  if (key === 'placed') return o.createdAt;
  if (key === 'confirmed' && o.payment?.paidAt) return o.payment.paidAt;
  return o.timeline?.find((t) => t.status === key)?.at;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: o, isLoading, isError, refetch } = useOrder(id);

  if (isLoading) return <div className="space-y-4"><div className="skeleton h-24" /><div className="skeleton h-28" /><div className="skeleton h-64" /></div>;
  if (isError || !o) {
    return <EmptyState icon={icons.box} title="Couldn't load this order" body="It may have been removed, or your connection dropped." action={{ label: 'Retry', onClick: () => refetch() }} />;
  }

  const reached = reachedIndex(o.status);
  const closed = o.status === 'cancelled' || o.status === 'refunded';
  const pieces = o.items.reduce((n, i) => n + i.qty, 0);
  const paid = o.payment?.status === 'paid';

  const copy = async (text: string, what: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  };

  return (
    <div>
      <Link href="/account/orders" className="text-[10px] uppercase tracking-[0.2em] text-cream-muted hover:text-gold">← All orders</Link>

      <div className="flex flex-wrap items-start justify-between gap-4 mt-6 mb-8">
        <div>
          <p className="label-eyebrow mb-3">Order {o.orderNumber}</p>
          <h1 className="font-display font-light text-cream text-4xl md:text-5xl leading-tight">{HEADLINES[o.status] ?? 'Your order'}</h1>
          <p className="text-sm text-cream-muted mt-2">Placed on {dateLabel(o.createdAt)}</p>
        </div>
        <StatusBadge status={o.status} />
      </div>

      {closed ? (
        <div className="p-5 border text-sm leading-relaxed text-cream" style={{ borderColor: `${statusStyle(o.status).color}66`, backgroundColor: `${statusStyle(o.status).color}14` }}>
          {o.status === 'refunded'
            ? 'Your refund has been issued to your original payment method. It can take 5–7 working days to appear.'
            : 'This order was cancelled. If you were charged, the amount will be refunded to your original payment method.'}
        </div>
      ) : (
        <ol className="grid grid-cols-4 bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] px-3 sm:px-6 py-6" aria-label="Order progress">
          {STEPS.map((s, i) => {
            const done = i <= reached;
            const d = done ? stepDate(o, s.key) : undefined;
            return (
              <li key={s.key} className="flex flex-col items-center text-center" aria-current={i === reached ? 'step' : undefined}>
                <div className="flex items-center w-full">
                  <span className={`flex-1 h-px ${i === 0 ? 'opacity-0' : done ? 'bg-gold' : 'bg-[rgba(201,169,110,0.25)]'}`} />
                  <span className={`rotate-45 border ${i === reached ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} ${done ? 'bg-gold border-gold' : 'border-[rgba(201,169,110,0.35)]'}`} />
                  <span className={`flex-1 h-px ${i === STEPS.length - 1 ? 'opacity-0' : i < reached ? 'bg-gold' : 'bg-[rgba(201,169,110,0.25)]'}`} />
                </div>
                <p className={`text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.18em] mt-3 ${done ? 'text-cream' : 'text-cream-muted/50'}`}>{s.label}</p>
                <p className="text-[10px] sm:text-xs text-cream-muted/80 mt-1 min-h-[1rem]">{d ? dateLabel(d) : ''}</p>
              </li>
            );
          })}
        </ol>
      )}

      {o.trackingNumber && (
        <button onClick={() => copy(o.trackingNumber!, 'Tracking number')} className="w-full flex items-center gap-4 mt-3 px-5 py-3.5 border border-[rgba(201,169,110,0.2)] hover:border-gold/60 text-left transition-colors">
          <span className="text-[10px] uppercase tracking-[0.2em] text-cream-muted">Tracking no.</span>
          <span className="flex-1 text-cream">{o.trackingNumber}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gold">Copy</span>
        </button>
      )}

      <div className="grid lg:grid-cols-[1fr_340px] gap-10 mt-12">
        <section>
          <SectionTitle title="Items" aside={piecesLabel(pieces)} />
          <div>
            {o.items.map((item, i) => {
              const product = typeof item.product === 'object' ? item.product : undefined;
              const image = item.image || product?.images?.[0];
              const row = (
                <div className="flex items-center gap-4 py-4 border-b border-[rgba(201,169,110,0.15)]">
                  <div className="relative w-16 h-20 bg-bg-card border border-[rgba(201,169,110,0.2)] shrink-0 overflow-hidden">
                    {image && <Image src={image} alt="" fill sizes="64px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-cream text-lg leading-snug">{item.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-cream-muted mt-1">Qty {item.qty} · {inr(item.price)} each</p>
                  </div>
                  <p className="text-cream">{inr(item.lineTotal ?? item.price * item.qty)}</p>
                </div>
              );
              return product?.slug ? <Link key={i} href={`/shop/${product.slug}`} className="block hover:bg-white/[0.02]">{row}</Link> : <div key={i}>{row}</div>;
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] p-6">
            <dl className="space-y-2.5 text-sm">
              <Row label="Subtotal" value={inr(o.subtotal)} />
              {!!o.couponDiscount && <Row label={`Coupon ${o.couponCode ?? ''}`} value={`− ${inr(o.couponDiscount)}`} gold />}
              {!!o.walletAmountUsed && <Row label="Wallet" value={`− ${inr(o.walletAmountUsed)}`} gold />}
              {!!o.loyaltyPointsUsed && <Row label="Loyalty points" value={`− ${inr(o.loyaltyPointsUsed)}`} gold />}
              <Row label="Shipping" value={o.shippingCharge ? inr(o.shippingCharge) : 'Complimentary'} />
            </dl>
            <div className="flex items-end justify-between border-t border-[rgba(201,169,110,0.2)] mt-4 pt-4">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold">{paid ? 'Total paid' : 'Total'}</span>
              <span className="font-display text-3xl text-cream leading-none">{inr(o.total)}</span>
            </div>
            <p className={`text-right text-[11px] mt-2 ${paid ? 'text-cream-muted/70' : 'text-[#E0B354]'}`}>
              {paid ? `Paid online${o.payment?.paidAt ? ` · ${dateTimeLabel(o.payment.paidAt)}` : ''}` : 'Payment not completed'}
            </p>
          </div>

          {o.address && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold mb-3">Delivering to</p>
              <div className="bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] p-5">
                <p className="font-display text-cream text-xl">{o.address.name}</p>
                {addressLines(o.address).map((l) => <p key={l} className="text-sm text-cream-muted leading-relaxed">{l}</p>)}
                {o.address.phone && <p className="text-sm text-cream-muted/80 mt-1">+91 {o.address.phone}</p>}
              </div>
            </div>
          )}

          <div className="border border-gold/35 p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Need help with this order?</p>
            <p className="text-sm text-cream-muted leading-relaxed mt-2">
              Write to <a href={`mailto:${SUPPORT}?subject=Order ${o.orderNumber}`} className="text-gold underline underline-offset-4">{SUPPORT}</a> and mention order {o.orderNumber}. We reply within a day.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[10px] uppercase tracking-[0.2em] text-cream-muted self-center">{label}</dt>
      <dd className={gold ? 'text-gold' : 'text-cream'}>{value}</dd>
    </div>
  );
}
