'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Image from 'next/image';
import { apiGet, apiPost, uploadImage } from '../../../../lib/api';

const schema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  price: z.number().positive(),
  mrp: z.number().positive().optional(),
  stock: z.number().int().min(0),
  fabric: z.string().optional(),
  weave: z.string().optional(),
  occasion: z.string().optional(),
  colourName: z.string().optional(),
  colourHex: z.string().optional(),
  category: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  inStock: z.boolean(),
  isFeatured: z.boolean(),
});
type ProductForm = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: catData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiGet<{ data: { _id: string; name: string }[] }>('/admin/categories'),
  });

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(schema),
    defaultValues: { inStock: true, isFeatured: false, stock: 10 },
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(Array.from(files).map(f => uploadImage(f).then(r => r.url)));
      setImages(prev => [...prev, ...urls]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally { setUploading(false); }
  };

  const onSubmit = async (values: ProductForm) => {
    if (!images.length) { toast.error('Upload at least one image'); return; }
    try {
      await apiPost('/admin/products', {
        ...values,
        images,
        colour: values.colourName ? { name: values.colourName, hex: values.colourHex ?? '#000000' } : undefined,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        occasion: values.occasion ? values.occasion.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('Product created! Live on website within 60 seconds.');
      router.push('/products');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create product');
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl text-secondary">New Product</h1>
        <button onClick={() => router.back()} className="btn-ghost">← Back</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div className="card">
          <h2 className="font-display text-2xl font-medium text-secondary mb-4">Saree Photos</h2>
          <div
            className="border-2 border-dashed border-border rounded-sm p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            {uploading ? (
              <p className="text-tertiary">Uploading to Cloudinary…</p>
            ) : (
              <>
                <svg className="w-8 h-8 mx-auto mb-3 text-primary" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 4v12M7 9l5-5 5 5" /></svg>
                <p className="font-semibold text-secondary">Drag & drop photos here</p>
                <p className="text-sm text-tertiary">or click to browse · JPG, PNG, WebP</p>
              </>
            )}
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-24 rounded-sm overflow-hidden border border-border group">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-error rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="font-display text-2xl font-medium text-secondary">Basic Information</h2>
          <div>
            <label className="label">Product Name *</label>
            <input {...register('name')} placeholder="e.g. Banarasi Silk Saree in Red" className="input" />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea {...register('description')} rows={4} placeholder="Describe the saree — material, finish, craftsmanship…" className="input resize-none" />
            {errors.description && <p className="text-xs text-error mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category *</label>
              <select {...register('category')} className="input">
                <option value="">Select category</option>
                {(catData?.data ?? []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.category && <p className="text-xs text-error mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="label">Fabric</label>
              <input {...register('fabric')} placeholder="e.g. Silk, Cotton, Georgette" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Weave / Work</label>
              <input {...register('weave')} placeholder="e.g. Banarasi, Kanjivaram" className="input" />
            </div>
            <div>
              <label className="label">Occasion (comma-separated)</label>
              <input {...register('occasion')} placeholder="Wedding, Festive, Casual" className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Colour Name</label>
              <input {...register('colourName')} placeholder="e.g. Deep Red" className="input" />
            </div>
            <div>
              <label className="label">Colour Hex</label>
              <input {...register('colourHex')} type="color" className="input h-10 p-1 cursor-pointer" />
            </div>
          </div>
          <div>
            <label className="label">Tags (comma-separated)</label>
            <input {...register('tags')} placeholder="bridal, bestseller, new-arrival" className="input" />
          </div>
        </div>

        {/* Pricing */}
        <div className="card space-y-4">
          <h2 className="font-display text-2xl font-medium text-secondary">Pricing & Stock</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Selling Price (₹) *</label>
              <input {...register('price', { valueAsNumber: true })} type="number" placeholder="4999" className="input" />
              {errors.price && <p className="text-xs text-error mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="label">MRP (₹)</label>
              <input {...register('mrp', { valueAsNumber: true })} type="number" placeholder="6999" className="input" />
            </div>
            <div>
              <label className="label">Stock Qty</label>
              <input {...register('stock', { valueAsNumber: true })} type="number" placeholder="10" className="input" />
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('inStock')} type="checkbox" className="accent-primary w-4 h-4" defaultChecked />
              <span className="text-sm font-semibold text-secondary">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isFeatured')} type="checkbox" className="accent-primary w-4 h-4" />
              <span className="text-sm font-semibold text-secondary">Featured on Homepage</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={isSubmitting || uploading} className="btn-primary h-12 px-8 text-base">
            {isSubmitting ? 'Publishing…' : 'Publish Saree'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost h-12">Cancel</button>
        </div>
      </form>
    </div>
  );
}
