'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiGet, apiPost, apiPatch, apiDelete } from '../../../lib/api';

interface Category { _id: string; name: string; slug: string; image?: string; parentCategory?: { _id: string; name: string } }

const schema = z.object({ name: z.string().min(2), image: z.string().url().optional().or(z.literal('')), parentCategory: z.string().optional() });
type CatForm = z.infer<typeof schema>;

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiGet<{ data: Category[] }>('/admin/categories'),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<CatForm>({ resolver: zodResolver(schema) });

  const saveMutation = useMutation({
    mutationFn: (values: CatForm) => editing
      ? apiPatch(`/admin/categories/${editing._id}`, values)
      : apiPost('/admin/categories', values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(editing ? 'Category updated' : 'Category created');
      reset(); setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-categories'] }); toast.success('Deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setValue('name', cat.name);
    setValue('image', cat.image ?? '');
    setValue('parentCategory', cat.parentCategory?._id ?? '');
  };

  const categories = data?.data ?? [];

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-4xl text-secondary mb-6">Categories</h1>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="card">
          <h2 className="font-display text-2xl font-medium text-secondary mb-4">{editing ? 'Edit Category' : 'New Category'}</h2>
          <form onSubmit={handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
            <div>
              <label className="label">Name *</label>
              <input {...register('name')} placeholder="e.g. Silk Sarees" className="input" />
              {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="label">Image URL</label>
              <input {...register('image')} placeholder="https://…" className="input" />
            </div>
            <div>
              <label className="label">Parent Category (optional)</label>
              <select {...register('parentCategory')} className="input">
                <option value="">None (top-level)</option>
                {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                {editing ? 'Save Changes' : 'Create'}
              </button>
              {editing && <button type="button" onClick={() => { setEditing(null); reset(); }} className="btn-ghost">Cancel</button>}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="card">
          <h2 className="font-display text-2xl font-medium text-secondary mb-4">All Categories ({categories.length})</h2>
          {isLoading ? (
            <div className="space-y-2">{[0,1,2,3].map(i => <div key={i} className="skeleton h-10" />)}</div>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div key={cat._id} className="flex items-center justify-between gap-2 p-3 rounded-sm border border-border">
                  <div>
                    <p className="font-semibold text-secondary text-sm">{cat.name}</p>
                    {cat.parentCategory && <p className="text-xs text-tertiary">under {cat.parentCategory.name}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => startEdit(cat)} className="text-xs text-primary hover:underline font-semibold">Edit</button>
                    <button onClick={() => { if (confirm(`Delete "${cat.name}"?`)) deleteMutation.mutate(cat._id); }} className="text-xs text-error hover:underline font-semibold">Delete</button>
                  </div>
                </div>
              ))}
              {!categories.length && <p className="text-tertiary text-sm">No categories yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
