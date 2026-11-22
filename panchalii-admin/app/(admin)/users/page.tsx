'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../../lib/api';

interface User {
  _id: string; name: string; email: string; phone?: string;
  role: string; isVerified: boolean; createdAt: string;
}

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => apiGet<{ data: User[]; pagination: { total: number; pages: number } }>(
      `/admin/users?page=${page}&limit=20&search=${search}`
    ),
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <div>
      <h1 className="font-display text-4xl text-secondary mb-6">Customers</h1>

      <div className="card mb-6">
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…" className="input max-w-md" />
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-tertiary">Customer</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-tertiary hidden lg:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {[1,2,3,4].map(j => <td key={j} className="px-4 py-3"><div className="skeleton h-4" /></td>)}
              </tr>
            ))}
            {!isLoading && users.map(u => (
              <tr key={u._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm shrink-0">
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-secondary">{u.name}</p>
                      <p className="text-xs text-tertiary">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-tertiary hidden md:table-cell">{u.phone ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${u.isVerified ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'}`}>
                    {u.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="px-4 py-3 text-tertiary hidden lg:table-cell">{new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            ))}
            {!isLoading && !users.length && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-tertiary">No customers found</td></tr>
            )}
          </tbody>
        </table>
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/50">
            <p className="text-sm text-tertiary">{pagination.total} customers</p>
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
