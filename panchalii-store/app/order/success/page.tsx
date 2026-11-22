'use client';
import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useOrder } from '../../../lib/account';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { inr } from '../../../lib/format';
import { DiamondRule } from '../../../components/ui';

function SuccessContent() {
  const orderId = useSearchParams().get('orderId') ?? '';
  const email = useAuthStore((s) => s.user?.email);
  const { data: order } = useOrder(orderId);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-16">
      <div className="max-w-lg w-full text-center">
        <div className="w-20 h-20 rounded-full border border-gold/60 flex items-center justify-center mx-auto text-gold">
          <svg className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <p className="label-eyebrow mt-8">Order confirmed</p>
        <h1 className="font-display font-light text-cream text-5xl md:text-6xl mt-3">Thank You</h1>
        <DiamondRule className="mt-5" />
        <p className="text-cream-muted leading-relaxed mt-6">
          {order ? <>Your order <span className="text-cream font-semibold">{order.orderNumber}</span> for {inr(order.total)} is confirmed.</> : 'Your order is confirmed.'}
          {email && <><br />A receipt is on its way to {email}.</>}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-10">
          <Link href={orderId ? `/account/orders/${orderId}` : '/account/orders'} className="btn-secondary">Track your order →</Link>
          <Link href="/shop" className="btn-primary">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return <Suspense><SuccessContent /></Suspense>;
}
