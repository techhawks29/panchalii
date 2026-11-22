'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiPost } from '../../lib/api';
import { addressLines, useAddresses, type Address } from '../../lib/account';
import { useAuthStore } from '../../lib/stores/auth.store';
import { useCartStore } from '../../lib/stores/cart.store';
import { useAuthReady } from '../../lib/useAuthReady';
import { loadRazorpay } from '../../lib/loadRazorpay';
import { errorMessage, inr, piecesLabel } from '../../lib/format';
import AddressDialog from '../../components/AddressDialog';
import { EmptyState, PageHeader, SectionTitle, Spinner, icons } from '../../components/ui';

const FREE_SHIPPING = 999;
const SHIPPING_FEE = 99;
const SUPPORT = 'hello@panchalii.in';

export default function CheckoutPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const ready = useAuthReady();
  const { isAuthenticated, user } = useAuthStore();
  const { items, subtotal, itemCount, clearCart } = useCartStore();
  const { data: addresses, isLoading: addressesLoading } = useAddresses();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [applying, setApplying] = useState(false);
  const [paying, setPaying] = useState(false);

  const total = subtotal();
  const shipping = total >= FREE_SHIPPING ? 0 : SHIPPING_FEE;
  const discount = applied?.discount ?? 0;
  const toPay = Math.max(0, total - discount + shipping);

  useEffect(() => {
    if (!addresses?.length) return;
    if (!selectedId || !addresses.some((a) => a._id === selectedId)) {
      setSelectedId((addresses.find((a) => a.isDefault) ?? addresses[0])._id);
    }
  }, [addresses, selectedId]);

  // The discount was checked against the old total; ask again if the bag changes
  useEffect(() => { setApplied(null); }, [total]);

  if (!ready) return <div className="min-h-[60vh] flex items-center justify-center text-gold"><Spinner className="w-6 h-6" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="py-10">
        <EmptyState icon={icons.bag} eyebrow="Almost there" title="Sign in to checkout" body="Your bag is saved. Sign in or create an account to choose a delivery address and pay." action={{ label: 'Sign in →', href: '/auth/login?next=/checkout' }} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-10">
        <EmptyState icon={icons.bag} eyebrow="Your bag" title="Is empty" body="Add a saree to your bag to check out." action={{ label: 'Explore collections →', href: '/shop' }} />
      </div>
    );
  }

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setApplying(true);
    try {
      const res = await apiPost<{ data: { discount: number } }>('/me/coupons/validate', { code, orderAmount: total });
      setApplied({ code, discount: Math.round(res.data.discount) });
      toast.success(`${code} applied — you save ${inr(res.data.discount)}`);
    } catch (err) {
      setApplied(null);
      toast.error(errorMessage(err, 'That coupon is not valid'));
    } finally {
      setApplying(false);
    }
  };

  const pay = async () => {
    if (paying) return;
    if (!selectedId) { toast.error('Add a delivery address to continue'); return; }
    setPaying(true);
    try {
      const [loaded, res] = await Promise.all([
        loadRazorpay(),
        apiPost<{ data: { razorpayOrderId: string; amount: number; keyId: string; orderId: string } }>('/me/payment/initiate', {
          addressId: selectedId,
          items: items.map((i) => ({ productId: i.product._id, qty: i.qty })),
          couponCode: applied?.code,
        }),
      ]);
      if (!loaded || !window.Razorpay) throw new Error("Couldn't open the payment window. Check your connection and try again.");
      const { razorpayOrderId, amount, keyId, orderId } = res.data;
      const selected = addresses?.find((a) => a._id === selectedId);

      const rzp = new window.Razorpay({
        key: keyId,
        // Same rounding the API uses when it creates the Razorpay order (paise)
        amount: Math.round(amount * 100),
        currency: 'INR',
        order_id: razorpayOrderId,
        name: 'Panchalii',
        description: 'Saree purchase',
        prefill: { name: user?.name, email: user?.email, contact: selected?.phone ?? user?.phone },
        theme: { color: '#C9A96E' },
        modal: { ondismiss: () => { setPaying(false); toast.info('Payment cancelled. Your bag is saved.'); } },
        handler: async (response) => {
          try {
            await apiPost('/me/payment/verify', { orderId, ...response });
            clearCart();
            qc.invalidateQueries({ queryKey: ['orders'] });
            router.push(`/order/success?orderId=${orderId}`);
          } catch {
            setPaying(false);
            toast.error(`We received your payment but couldn't confirm the order yet. Write to ${SUPPORT} with payment ID ${response.razorpay_payment_id}.`, { duration: 15000 });
          }
        },
      });
      rzp.on('payment.failed', (r) => toast.error(`Payment failed: ${r.error.description}. Please try again.`));
      rzp.open();
    } catch (err) {
      setPaying(false);
      toast.error(errorMessage(err, 'Could not start the payment'));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-6 py-12">
      <PageHeader eyebrow="Checkout" title="Almost Yours" />

      <div className="grid lg:grid-cols-[1fr_400px] gap-12">
        <div className="space-y-14">
          <section>
            <SectionTitle number="01" title="Delivery Address" />
            {addressesLoading ? (
              <div className="skeleton h-36" />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Delivery address">
                {addresses?.map((a) => (
                  <AddressOption key={a._id} address={a} selected={a._id === selectedId} onSelect={() => setSelectedId(a._id)} />
                ))}
                <button
                  onClick={() => setDialogOpen(true)}
                  className={`border border-dashed border-gold/50 hover:border-gold hover:bg-gold/[0.04] transition-colors flex flex-col items-center justify-center gap-2 py-10 ${addresses?.length ? '' : 'sm:col-span-2'}`}
                >
                  {!addresses?.length && <span className="font-display text-cream text-xl">No saved addresses yet</span>}
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gold">+ Add a new address</span>
                </button>
              </div>
            )}
          </section>

          <section>
            <SectionTitle number="02" title="Your Order" aside={piecesLabel(itemCount())} />
            <ul className="border-t border-[rgba(201,169,110,0.15)]">
              {items.map(({ product, qty }) => (
                <li key={product._id} className="flex items-center gap-4 py-4 border-b border-[rgba(201,169,110,0.15)]">
                  <div className="relative w-14 h-[72px] shrink-0 bg-bg-card border border-[rgba(201,169,110,0.2)] overflow-hidden">
                    {product.images[0] && <Image src={product.images[0]} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-cream text-lg leading-snug">{product.name}</p>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-cream-muted mt-1">Qty {qty} · {inr(product.price)} each</p>
                  </div>
                  <p className="text-cream">{inr(product.price * qty)}</p>
                </li>
              ))}
            </ul>
            <Link href="/cart" className="inline-block mt-4 text-[10px] uppercase tracking-[0.2em] text-gold hover:text-gold-light">Edit bag</Link>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start bg-[#0F1A0F] border border-[rgba(201,169,110,0.2)] p-7">
          <h2 className="font-display text-cream text-2xl mb-6">Summary</h2>

          <form onSubmit={(e) => { e.preventDefault(); applyCoupon(); }} className="flex mb-6">
            <label htmlFor="coupon" className="sr-only">Coupon code</label>
            <input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" className="input !py-2.5 uppercase tracking-[0.15em] text-xs flex-1" />
            <button type="submit" disabled={applying || !coupon.trim()} className="btn-primary !px-5 !py-2.5 -ml-px">{applying ? <Spinner /> : 'Apply'}</button>
          </form>

          <dl className="space-y-3 text-sm">
            <Row label="Subtotal" value={inr(total)} />
            {applied && (
              <div className="flex justify-between">
                <dt className="text-[10px] uppercase tracking-[0.2em] text-cream-muted self-center">
                  Coupon {applied.code} <button onClick={() => setApplied(null)} className="ml-1 text-cream-muted/60 hover:text-cream" aria-label="Remove coupon">×</button>
                </dt>
                <dd className="text-gold">− {inr(discount)}</dd>
              </div>
            )}
            <Row label="Shipping" value={shipping ? inr(shipping) : 'Complimentary'} />
          </dl>
          {shipping > 0 && <p className="text-xs text-gold/85 mt-2">Add {inr(FREE_SHIPPING - total)} more for complimentary shipping</p>}

          <div className="flex items-end justify-between border-t border-[rgba(201,169,110,0.2)] mt-5 pt-5">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">To pay</span>
            <span className="font-display text-cream text-3xl leading-none">{inr(toPay)}</span>
          </div>
          <p className="text-right text-[11px] text-cream-muted/60 mt-1">Inclusive of all taxes</p>

          <button onClick={pay} disabled={paying || !selectedId} className="btn-secondary w-full h-13 py-4 mt-7">
            {paying ? <Spinner /> : `Pay ${inr(toPay)} securely →`}
          </button>
          {!selectedId && !addressesLoading && <p className="text-xs text-cream-muted text-center mt-3">Add a delivery address to continue</p>}
          <p className="text-center text-[9px] uppercase tracking-[0.2em] text-cream-muted/60 mt-4">Razorpay · UPI · Cards · Netbanking</p>
        </aside>
      </div>

      <AddressDialog open={dialogOpen} defaultName={user?.name} onClose={() => setDialogOpen(false)} onSaved={(a) => setSelectedId(a._id)} />
    </div>
  );
}

function AddressOption({ address: a, selected, onSelect }: { address: Address; selected: boolean; onSelect: () => void }) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`text-left p-5 border transition-colors ${selected ? 'border-gold bg-gold/[0.06]' : 'border-[rgba(201,169,110,0.2)] bg-[#0F1A0F] hover:border-gold/50'}`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-2.5 h-2.5 rotate-45 border ${selected ? 'bg-gold border-gold' : 'border-gold/50'}`} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">{a.label || 'Home'}</span>
        {a.isDefault && <span className="text-[9px] uppercase tracking-[0.2em] text-cream-muted/70">· Default</span>}
      </div>
      <p className="font-display text-cream text-xl mt-3">{a.name}</p>
      {addressLines(a).map((l) => <p key={l} className="text-sm text-cream-muted leading-relaxed">{l}</p>)}
      <p className="text-sm text-cream-muted/80 mt-1">+91 {a.phone}</p>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-[10px] uppercase tracking-[0.2em] text-cream-muted self-center">{label}</dt>
      <dd className="text-cream">{value}</dd>
    </div>
  );
}
