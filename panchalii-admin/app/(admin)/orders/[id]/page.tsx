'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { apiGet, apiPatch } from '../../../../lib/api';

interface OrderDetail {
  _id: string;
  orderNumber: string;
  user: { _id: string; name: string; email: string; phone?: string };
  items: { product: { _id: string; name: string; images: string[]; price: number }; qty: number; price: number }[];
  address: { name: string; phone: string; line1: string; line2?: string; city: string; state: string; pincode: string };
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: string;
  payment: { status: string; paymentId?: string };
  timeline: { status: string; note?: string; at: string }[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-400/10 text-amber-300',
  confirmed: 'bg-sky-400/10 text-sky-300',
  processing: 'bg-sky-400/10 text-sky-300',
  shipped: 'bg-violet-400/10 text-violet-300',
  delivered: 'bg-emerald-400/10 text-emerald-300',
  cancelled: 'bg-red-400/10 text-red-300',
};

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => apiGet<{ data: OrderDetail }>(`/admin/orders/${id}`),
  });

  const updateStatus = useMutation({
    mutationFn: (newStatus: string) => apiPatch(`/admin/orders/${id}/status`, { status: newStatus }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-order', id] }); toast.success('Status updated'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const o = data?.data;

  if (isLoading) return <div className="card"><div className="skeleton h-64" /></div>;
  if (!o) return <p className="text-tertiary">Order not found</p>;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-4xl text-secondary">{o.orderNumber}</h1>
          <p className="text-tertiary text-sm">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`badge capitalize text-sm ${statusColors[o.status] ?? 'bg-muted text-tertiary'}`}>{o.status}</span>
          <button onClick={() => router.back()} className="btn-ghost">← Back</button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-display text-2xl font-medium text-secondary mb-4">Items</h2>
            <div className="space-y-3">
              {o.items.map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-14 h-18 bg-muted rounded-sm overflow-hidden shrink-0 relative">
                    {item.product?.images?.[0] && <Image src={item.product.images[0]} alt="" fill className="object-cover" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-secondary text-sm">{item.product?.name}</p>
                    <p className="text-xs text-tertiary">Qty: {item.qty}</p>
                    <p className="text-sm font-bold text-secondary">₹{(item.price * item.qty).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-tertiary"><span>Subtotal</span><span>₹{o.subtotal.toLocaleString('en-IN')}</span></div>
              {o.discount > 0 && <div className="flex justify-between text-primary"><span>Discount</span><span>−₹{o.discount.toLocaleString('en-IN')}</span></div>}
              <div className="flex justify-between text-tertiary"><span>Shipping</span><span>{o.shipping === 0 ? 'Free' : `₹${o.shipping}`}</span></div>
              <div className="flex justify-between font-bold text-secondary text-base pt-2 border-t border-border"><span>Total</span><span>₹{o.total.toLocaleString('en-IN')}</span></div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card">
            <h2 className="font-display text-2xl font-medium text-secondary mb-4">Order Timeline</h2>
            <div className="space-y-3">
              {o.timeline.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-secondary capitalize">{t.status}</p>
                    {t.note && <p className="text-xs text-tertiary">{t.note}</p>}
                    <p className="text-xs text-tertiary">{new Date(t.at).toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Update status */}
          <div className="card">
            <h2 className="font-display text-2xl font-medium text-secondary mb-3">Update Status</h2>
            <div className="space-y-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => updateStatus.mutate(s)}
                  disabled={o.status === s || updateStatus.isPending}
                  className={`w-full text-left px-4 py-2.5 rounded-sm text-sm font-semibold capitalize transition-colors ${
                    o.status === s ? 'bg-primary/10 text-secondary' : 'hover:bg-muted text-tertiary'
                  }`}
                >
                  {o.status === s && '✓ '}{s}
                </button>
              ))}
            </div>
          </div>

          {/* Customer */}
          <div className="card">
            <h2 className="font-display text-2xl font-medium text-secondary mb-3">Customer</h2>
            <p className="font-semibold text-secondary">{o.user?.name}</p>
            <p className="text-sm text-tertiary">{o.user?.email}</p>
            {o.user?.phone && <p className="text-sm text-tertiary">{o.user.phone}</p>}
          </div>

          {/* Address */}
          <div className="card">
            <h2 className="font-display text-2xl font-medium text-secondary mb-3">Delivery Address</h2>
            <p className="font-semibold text-secondary text-sm">{o.address.name}</p>
            <p className="text-sm text-tertiary">{o.address.line1}{o.address.line2 ? `, ${o.address.line2}` : ''}</p>
            <p className="text-sm text-tertiary">{o.address.city}, {o.address.state} — {o.address.pincode}</p>
            <p className="text-sm text-tertiary">{o.address.phone}</p>
          </div>

          {/* Payment */}
          <div className="card">
            <h2 className="font-display text-2xl font-medium text-secondary mb-3">Payment</h2>
            <span className={`badge capitalize ${o.payment.status === 'paid' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>
              {o.payment.status}
            </span>
            {o.payment.paymentId && <p className="text-xs text-tertiary mt-2 font-mono">{o.payment.paymentId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
