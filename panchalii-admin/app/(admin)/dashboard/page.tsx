'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api';

interface Analytics {
  revenue: { today: number; thisMonth: number; total: number };
  orders: { today: number; pending: number; total: number };
  products: { total: number; outOfStock: number };
  users: { total: number; newThisMonth: number };
  topProducts: { _id: string; name: string; sold: number; revenue: number }[];
  recentOrders: { _id: string; orderNumber: string; total: number; status: string; createdAt: string }[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-amber-400/10 text-amber-300',
  confirmed: 'bg-sky-400/10 text-sky-300',
  shipped: 'bg-violet-400/10 text-violet-300',
  delivered: 'bg-emerald-400/10 text-emerald-300',
  cancelled: 'bg-red-400/10 text-red-300',
};

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function PageHeader() {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div className="mb-9">
      <p className="eyebrow mb-2">Overview</p>
      <h1 className="font-display text-4xl text-secondary">Dashboard</h1>
      <p className="text-sm text-tertiary/70 mt-1">{today}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => apiGet<{ data: Analytics }>('/admin/analytics'),
    refetchInterval: 60_000,
  });

  const a = data?.data;

  if (isLoading) {
    return (
      <div>
        <PageHeader />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-8">
          {[0, 1, 2, 3].map((i) => <div key={i} className="bg-card p-6"><div className="skeleton h-20" /></div>)}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Today's Revenue", value: inr(a?.revenue.today ?? 0), sub: `${inr(a?.revenue.thisMonth ?? 0)} this month` },
    { label: "Today's Orders", value: a?.orders.today ?? 0, sub: `${a?.orders.pending ?? 0} pending` },
    { label: 'Products', value: a?.products.total ?? 0, sub: `${a?.products.outOfStock ?? 0} out of stock` },
    { label: 'Customers', value: a?.users.total ?? 0, sub: `+${a?.users.newThisMonth ?? 0} this month` },
  ];

  return (
    <div>
      <PageHeader />

      {/* Stats: one framed strip with hairline dividers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-card px-6 py-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-tertiary">{s.label}</p>
            <p className="font-display text-4xl text-secondary mt-3 leading-none">{s.value}</p>
            <p className="text-xs text-primary/80 mt-3">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <section className="card">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-2xl text-secondary">Top Products</h2>
            <Link href="/products" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary hover:text-primary-light">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {(a?.topProducts ?? []).slice(0, 5).map((p, i) => (
              <div key={p._id} className="flex items-center gap-4 py-3">
                <span className="font-display text-xl text-primary/70 w-6 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-secondary truncate">{p.name}</p>
                  <p className="text-xs text-tertiary/70">{p.sold} units sold</p>
                </div>
                <p className="text-sm text-secondary tabular-nums">{inr(p.revenue)}</p>
              </div>
            ))}
            {!a?.topProducts?.length && <p className="text-tertiary/70 text-sm py-3">No sales yet</p>}
          </div>
        </section>

        <section className="card">
          <div className="flex items-baseline justify-between mb-5">
            <h2 className="font-display text-2xl text-secondary">Recent Orders</h2>
            <Link href="/orders" className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary hover:text-primary-light">View all →</Link>
          </div>
          <div className="divide-y divide-border">
            {(a?.recentOrders ?? []).slice(0, 6).map((o) => (
              <Link key={o._id} href={`/orders/${o._id}`} className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 hover:bg-white/[0.02] transition-colors">
                <div>
                  <p className="text-sm text-secondary">{o.orderNumber}</p>
                  <p className="text-xs text-tertiary/70">{new Date(o.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-secondary tabular-nums">{inr(o.total)}</span>
                  <span className={`badge ${statusColors[o.status] ?? 'bg-white/5 text-tertiary'}`}>{o.status}</span>
                </div>
              </Link>
            ))}
            {!a?.recentOrders?.length && <p className="text-tertiary/70 text-sm py-3">No orders yet</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
