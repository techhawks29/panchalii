'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';
import { apiGet, apiPatch } from '../../../lib/api';

interface Order {
  _id: string;
  orderNumber: string;
  user: { name: string; email: string };
  total: number;
  status: string;
  items: { name: string; qty: number }[];
  createdAt: string;
}

const STATUSES = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const statusColors: Record<string, string> = {
  pending: 'bg-amber-400/10 text-amber-300',
  confirmed: 'bg-sky-400/10 text-sky-300',
  processing: 'bg-sky-400/10 text-sky-300',
  shipped: 'bg-violet-400/10 text-violet-300',
  delivered: 'bg-emerald-400/10 text-emerald-300',
  cancelled: 'bg-red-400/10 text-red-300',
  refunded: 'bg-white/5 text-tertiary',
};

export default function OrdersPage() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, page],
    queryFn: () => apiGet<{ data: Order[]; pagination: { total: number; pages: number } }>(
      `/admin/orders?page=${page}&limit=20${status !== 'all' ? `&status=${status}` : ''}`
    ),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: string }) =>
      apiPatch(`/admin/orders/${id}/status`, { status: newStatus }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); toast.success('Order updated'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const orders = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <h1 className="font-display text-4xl text-secondary mb-6">Orders</h1>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize ${status === s ? 'bg-primary text-ink' : 'bg-white border border-border text-tertiary hover:border-primary'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-tertiary">Order</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary hidden md:table-cell">Customer</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary">Amount</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary hidden lg:table-cell">Date</th>
              <th className="px-4 py-3 font-semibold text-tertiary">Update</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {[1,2,3,4,5,6].map(j => <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>)}
              </tr>
            ))}
            {!isLoading && orders.map((o) => (
              <tr key={o._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/orders/${o._id}`} className="font-semibold text-secondary hover:text-primary">{o.orderNumber}</Link>
                  <p className="text-xs text-tertiary line-clamp-1">{o.items.map(i => `${i.name}×${i.qty}`).join(', ')}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="font-semibold text-secondary">{o.user?.name}</p>
                  <p className="text-xs text-tertiary">{o.user?.email}</p>
                </td>
                <td className="px-4 py-3 font-bold text-secondary">₹{o.total.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`badge capitalize ${statusColors[o.status] ?? 'bg-muted text-tertiary'}`}>{o.status}</span>
                </td>
                <td className="px-4 py-3 text-tertiary hidden lg:table-cell">{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <select
                    value={o.status}
                    onChange={e => updateStatus.mutate({ id: o._id, newStatus: e.target.value })}
                    className="text-xs border border-border rounded-sm px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STATUSES.filter(s => s !== 'all').map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {!isLoading && !orders.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-tertiary">No orders found</td></tr>
            )}
          </tbody>
        </table>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50">
            <p className="text-sm text-tertiary">{pagination.total} orders</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm py-1 px-3">← Prev</button>
              <span className="text-sm text-tertiary">{page} / {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-ghost text-sm py-1 px-3">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
