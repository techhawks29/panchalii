'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { apiGet, apiDelete } from '../../../lib/api';

interface Product {
  _id: string;
  name: string;
  slug: string;
  category: { name: string };
  price: number;
  mrp?: number;
  images: string[];
  inStock: boolean;
  isFeatured: boolean;
  fabric?: string;
  createdAt: string;
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => apiGet<{ data: Product[]; pagination: { total: number; pages: number } }>(
      `/admin/products?page=${page}&limit=20&search=${search}`
    ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/products/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-products'] }); toast.success('Product deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const products = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl text-secondary">Products</h1>
        <Link href="/products/new" className="btn-primary">+ Add Product</Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search products by name, fabric, category…"
          className="input max-w-md"
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-tertiary">Product</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary">Price</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary hidden lg:table-cell">Stock</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary hidden lg:table-cell">Featured</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="px-4 py-3"><div className="skeleton h-10 w-48" /></td>
                <td className="px-4 py-3 hidden md:table-cell"><div className="skeleton h-4 w-24" /></td>
                <td className="px-4 py-3"><div className="skeleton h-4 w-20" /></td>
                <td className="px-4 py-3 hidden lg:table-cell"><div className="skeleton h-4 w-16" /></td>
                <td className="px-4 py-3 hidden lg:table-cell"><div className="skeleton h-4 w-12" /></td>
                <td className="px-4 py-3"><div className="skeleton h-4 w-16" /></td>
              </tr>
            ))}
            {!isLoading && products.map((p) => (
              <tr key={p._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-12 bg-muted rounded-sm overflow-hidden shrink-0 relative">
                      {p.images[0] && <Image src={p.images[0]} alt={p.name} fill className="object-cover" />}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary line-clamp-1">{p.name}</p>
                      <p className="text-xs text-tertiary">{p.fabric ?? '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-tertiary">{p.category?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <p className="font-bold text-secondary">₹{p.price.toLocaleString('en-IN')}</p>
                  {!!p.mrp && p.mrp > p.price && (
                    <p className="text-xs text-tertiary line-through">₹{p.mrp.toLocaleString('en-IN')}</p>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <span className={`badge ${p.inStock ? 'bg-emerald-400/10 text-emerald-300' : 'bg-red-400/10 text-red-300'}`}>
                    {p.inStock ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-tertiary">
                  {p.isFeatured ? <span className="text-primary">◆ Featured</span> : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/products/${p._id}/edit`} className="text-xs text-primary hover:underline font-semibold">Edit</Link>
                    <button
                      onClick={() => { if (confirm(`Delete "${p.name}"?`)) deleteMutation.mutate(p._id); }}
                      className="text-xs text-error hover:underline font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && !products.length && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-tertiary">No products found</td></tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50">
            <p className="text-sm text-tertiary">{pagination.total} products</p>
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
