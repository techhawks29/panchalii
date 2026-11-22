'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api';

interface Coupon {
  _id: string; code: string; type: 'percent' | 'flat'; value: number;
  minOrder?: number; maxUses?: number; usedCount: number; expiry?: string; isActive: boolean;
}

const schema = z.object({
  code: z.string().min(3).toUpperCase(),
  type: z.enum(['percent', 'flat']),
  value: z.number().positive(),
  minOrder: z.number().min(0).optional(),
  maxUses: z.number().int().positive().optional(),
  expiry: z.string().optional(),
  isActive: z.boolean(),
});
type CouponForm = z.infer<typeof schema>;

export default function CouponsPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Coupon | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => apiGet<{ data: Coupon[] }>('/admin/coupons'),
  });

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CouponForm>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'percent' as const, isActive: true },
  });

  const saveMutation = useMutation({
    mutationFn: (values: CouponForm) => editing
      ? apiPatch(`/admin/coupons/${editing._id}`, values)
      : apiPost('/admin/coupons', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success(editing ? 'Coupon updated' : 'Coupon created');
      reset({ type: 'percent' as const, isActive: true }); setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/coupons/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); toast.success('Deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (c: Coupon) => {
    setEditing(c);
    setValue('code', c.code); setValue('type', c.type); setValue('value', c.value);
    setValue('minOrder', c.minOrder); setValue('maxUses', c.maxUses);
    setValue('expiry', c.expiry ? c.expiry.split('T')[0] : '');
    setValue('isActive', c.isActive);
  };

  const type = watch('type');
  const coupons = data?.data ?? [];

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-4xl text-secondary mb-6">Coupons</h1>
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card">
          <h2 className="font-display text-2xl font-medium text-secondary mb-4">{editing ? 'Edit Coupon' : 'New Coupon'}</h2>
          <form onSubmit={handleSubmit(v => saveMutation.mutate(v))} className="space-y-3">
            <div>
              <label className="label">Code *</label>
              <input {...register('code')} placeholder="SAVE10" className="input uppercase" />
              {errors.code && <p className="text-xs text-error mt-1">{errors.code.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Type</label>
                <select {...register('type')} className="input">
                  <option value="percent">Percent (%)</option>
                  <option value="flat">Flat (₹)</option>
                </select>
              </div>
              <div>
                <label className="label">{type === 'percent' ? 'Discount %' : 'Amount (₹)'}</label>
                <input {...register('value', { valueAsNumber: true })} type="number" placeholder={type === 'percent' ? '10' : '200'} className="input" />
              </div>
            </div>
            <div>
              <label className="label">Min Order (₹)</label>
              <input {...register('minOrder', { valueAsNumber: true })} type="number" placeholder="500" className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Max Uses</label>
                <input {...register('maxUses', { valueAsNumber: true })} type="number" placeholder="100" className="input" />
              </div>
              <div>
                <label className="label">Expiry</label>
                <input {...register('expiry')} type="date" className="input" />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isActive')} type="checkbox" className="accent-primary w-4 h-4" />
              <span className="text-sm font-semibold text-secondary">Active</span>
            </label>
            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {editing ? 'Save' : 'Create'}
              </button>
              {editing && <button type="button" onClick={() => { setEditing(null); reset({ type: 'percent', isActive: true }); }} className="btn-ghost">Cancel</button>}
            </div>
          </form>
        </div>

        {/* Table */}
        <div className="lg:col-span-3 card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-tertiary">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-tertiary">Discount</th>
                <th className="text-left px-4 py-3 font-semibold text-tertiary hidden md:table-cell">Uses</th>
                <th className="text-left px-4 py-3 font-semibold text-tertiary">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && [0,1,2].map(i => (
                <tr key={i} className="border-b border-border"><td colSpan={5} className="px-4 py-3"><div className="skeleton h-4" /></td></tr>
              ))}
              {!isLoading && coupons.map(c => (
                <tr key={c._id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-secondary">{c.code}</td>
                  <td className="px-4 py-3 text-tertiary">{c.type === 'percent' ? `${c.value}%` : `₹${c.value}`}</td>
                  <td className="px-4 py-3 text-tertiary hidden md:table-cell">{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${c.isActive ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-tertiary'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(c)} className="text-xs text-primary hover:underline font-semibold">Edit</button>
                      <button onClick={() => { if (confirm('Delete coupon?')) deleteMutation.mutate(c._id); }} className="text-xs text-error hover:underline font-semibold">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !coupons.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-tertiary">No coupons yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
