'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import { toast } from 'sonner';
import { apiDelete, apiGet, apiPatch } from '../../../lib/api';

interface Review {
  _id: string;
  user: { name: string; email: string };
  product: { _id: string; name: string; images: string[] };
  rating: number;
  title?: string;
  body: string;
  images?: string[];
  isApproved: boolean;
  createdAt: string;
}

export default function ReviewsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: () => apiGet<{ data: Review[] }>('/admin/reviews/pending'),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => apiPatch(`/admin/reviews/${id}/approve`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Review approved'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/reviews/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); toast.success('Review rejected'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const reviews = data?.data ?? [];

  return (
    <div>
      <h1 className="font-display text-4xl text-secondary mb-6">Pending Reviews ({reviews.length})</h1>

      {isLoading && (
        <div className="space-y-4">{[0,1,2].map(i => <div key={i} className="card"><div className="skeleton h-24" /></div>)}</div>
      )}

      {!isLoading && !reviews.length && (
        <div className="card text-center py-16">
          <p className="text-primary text-sm mb-3" aria-hidden="true">◆</p>
          <p className="font-semibold text-secondary">All reviews are moderated</p>
          <p className="text-tertiary text-sm mt-1">No pending reviews</p>
        </div>
      )}

      <div className="space-y-4">
        {!isLoading && reviews.map((r) => (
          <div key={r._id} className="card">
            <div className="flex items-start gap-4">
              {/* Product thumb */}
              <div className="w-14 h-18 bg-muted rounded-sm overflow-hidden shrink-0 relative">
                {r.product?.images?.[0] && <Image src={r.product.images[0]} alt="" fill className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-secondary text-sm">{r.product?.name}</p>
                    <p className="text-xs text-tertiary">{r.user?.name} · {r.user?.email}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < r.rating ? 'text-warning' : 'text-border'}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-tertiary shrink-0">{new Date(r.createdAt).toLocaleDateString('en-IN')}</p>
                </div>
                {r.title && <p className="font-semibold text-secondary text-sm mt-2">{r.title}</p>}
                <p className="text-sm text-tertiary mt-1 line-clamp-3">{r.body}</p>
                {r.images?.length ? (
                  <div className="flex gap-2 mt-2">
                    {r.images.map((img, i) => (
                      <div key={i} className="w-12 h-12 bg-muted rounded-sm overflow-hidden relative">
                        <Image src={img} alt="" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <button onClick={() => approveMutation.mutate(r._id)} disabled={approveMutation.isPending} className="btn-primary text-sm py-2">
                ✓ Approve
              </button>
              <button onClick={() => { if (window.confirm('Reject and permanently delete this review?')) rejectMutation.mutate(r._id); }} disabled={rejectMutation.isPending} className="btn-danger text-sm py-2">
                ✗ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
