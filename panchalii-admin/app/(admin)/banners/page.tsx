'use client';
import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import Image from 'next/image';
import { apiGet, apiPost, apiPatch, apiDelete, uploadImage } from '../../../lib/api';

interface Banner { _id: string; title: string; image: string; link?: string; position: number; isActive: boolean }

const schema = z.object({
  title: z.string().min(2),
  link: z.string().optional(),
  position: z.number().int().min(1),
  isActive: z.boolean(),
});
type BannerForm = z.infer<typeof schema>;

export default function BannersPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Banner | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => apiGet<{ data: Banner[] }>('/admin/banners'),
  });

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<BannerForm>({
    resolver: zodResolver(schema),
    defaultValues: { position: 1, isActive: true, link: '' },
  });

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      setPreviewUrl(url);
    } catch (err: unknown) { toast.error(err instanceof Error ? err.message : 'Upload failed'); }
    finally { setUploading(false); }
  };

  const saveMutation = useMutation({
    mutationFn: (values: BannerForm) => {
      if (!previewUrl && !editing?.image) throw new Error('Upload a banner image');
      const payload = { ...values, image: previewUrl || editing?.image };
      return editing ? apiPatch(`/admin/banners/${editing._id}`, payload) : apiPost('/admin/banners', payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-banners'] });
      toast.success(editing ? 'Banner updated' : 'Banner created');
      reset({ position: 1, isActive: true, link: '' }); setEditing(null); setPreviewUrl('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/admin/banners/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-banners'] }); toast.success('Deleted'); },
    onError: (err: Error) => toast.error(err.message),
  });

  const startEdit = (b: Banner) => {
    setEditing(b); setPreviewUrl(b.image);
    setValue('title', b.title); setValue('link', b.link ?? ''); setValue('position', b.position); setValue('isActive', b.isActive);
  };

  const banners = data?.data ?? [];

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-4xl text-secondary mb-6">Banners</h1>
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 card">
          <h2 className="font-display text-2xl font-medium text-secondary mb-4">{editing ? 'Edit Banner' : 'New Banner'}</h2>
          <form onSubmit={handleSubmit(v => saveMutation.mutate(v))} className="space-y-4">
            {/* Image upload */}
            <div>
              <label className="label">Banner Image *</label>
              <div
                className="border-2 border-dashed border-border rounded-sm overflow-hidden cursor-pointer hover:border-primary transition-colors"
                style={{ aspectRatio: '3/1' }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                {previewUrl ? (
                  <div className="relative w-full h-full">
                    <Image src={previewUrl} alt="" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full py-6 text-tertiary text-sm">
                    {uploading ? 'Uploading…' : 'Click to upload (3:1 ratio ideal)'}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="label">Title *</label>
              <input {...register('title')} placeholder="New Collection 2025" className="input" />
              {errors.title && <p className="text-xs text-error mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="label">Link URL</label>
              <input {...register('link')} placeholder="/shop?category=silk" className="input" />
            </div>
            <div>
              <label className="label">Display Order</label>
              <input {...register('position', { valueAsNumber: true })} type="number" className="input" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isActive')} type="checkbox" className="accent-primary w-4 h-4" />
              <span className="text-sm font-semibold text-secondary">Active (shows on homepage)</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={isSubmitting || uploading} className="btn-primary">{editing ? 'Save' : 'Create'}</button>
              {editing && <button type="button" onClick={() => { setEditing(null); reset({ position: 1, isActive: true }); setPreviewUrl(''); }} className="btn-ghost">Cancel</button>}
            </div>
          </form>
        </div>

        {/* List */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading && [0,1,2].map(i => <div key={i} className="card"><div className="skeleton h-24" /></div>)}
          {!isLoading && banners.map(b => (
            <div key={b._id} className="card flex gap-4 items-center">
              <div className="w-28 h-16 bg-muted rounded-sm overflow-hidden shrink-0 relative">
                <Image src={b.image} alt={b.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary">{b.title}</p>
                <p className="text-xs text-tertiary">Position {b.position}</p>
                <span className={`badge text-xs mt-1 inline-block ${b.isActive ? 'bg-emerald-400/10 text-emerald-300' : 'bg-white/5 text-tertiary'}`}>
                  {b.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <button onClick={() => startEdit(b)} className="text-xs text-primary hover:underline font-semibold">Edit</button>
                <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(b._id); }} className="text-xs text-error hover:underline font-semibold">Delete</button>
              </div>
            </div>
          ))}
          {!isLoading && !banners.length && <div className="card text-center py-10 text-tertiary">No banners yet</div>}
        </div>
      </div>
    </div>
  );
}
