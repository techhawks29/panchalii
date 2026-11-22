'use client';
import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import Image from 'next/image';
import { apiGet, apiPatch, uploadImage } from '../../../../../lib/api';

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
  category: z.string().min(1),
  tags: z.string().optional(),
  inStock: z.boolean(),
  isFeatured: z.boolean(),
});
type ProductForm = z.infer<typeof schema>;

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: catData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => apiGet<{ data: { _id: string; name: string }[] }>('/admin/categories'),
  });

  const { data: productData } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => apiGet<{ data: { name: string; description: string; price: number; mrp?: number; stock: number; fabric?: string; weave?: string; occasion?: string[]; colour?: { name: string; hex: string }; category: { _id: string }; tags?: string[]; inStock: boolean; isFeatured: boolean; images: string[] } }>(`/admin/products/${id}`),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProductForm>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (productData?.data) {
      const p = productData.data;
      reset({
        name: p.name,
        description: p.description,
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        fabric: p.fabric,
        weave: p.weave,
        occasion: p.occasion?.join(', '),
        colourName: p.colour?.name,
        colourHex: p.colour?.hex,
        category: p.category?._id,
        tags: p.tags?.join(', '),
        inStock: p.inStock,
        isFeatured: p.isFeatured,
      });
      setImages(p.images);
    }
  }, [productData, reset]);

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
    if (!images.length) { toast.error('Keep at least one image'); return; }
    try {
      await apiPatch(`/admin/products/${id}`, {
        ...values,
        images,
        colour: values.colourName ? { name: values.colourName, hex: values.colourHex ?? '#000000' } : undefined,
        tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        occasion: values.occasion ? values.occasion.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('Product updated!');
      router.push('/products');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl text-secondary">Edit Product</h1>
        <button onClick={() => router.back()} className="btn-ghost">← Back</button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Images */}
        <div className="card">
          <h2 className="font-display text-2xl font-medium text-secondary mb-4">Saree Photos</h2>
          <div
            className="border-2 border-dashed border-border rounded-sm p-6 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
          >
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
            {uploading ? <p className="text-tertiary">Uploading…</p> : <p className="text-tertiary text-sm">Drop new photos here or click to add</p>}
          </div>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-24 rounded-sm overflow-hidden border border-border group">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => setImages(imgs => imgs.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-error rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <h2 className="font-display text-2xl font-medium text-secondary">Basic Information</h2>
          <div>
            <label className="label">Product Name</label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-xs text-error mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <textarea {...register('description')} rows={4} className="input resize-none" />
            {errors.description && <p className="text-xs text-error mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select {...register('category')} className="input">
                <option value="">Select</option>
                {(catData?.data ?? []).map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Fabric</label>
              <input {...register('fabric')} className="input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Weave</label><input {...register('weave')} className="input" /></div>
            <div><label className="label">Occasion</label><input {...register('occasion')} placeholder="Wedding, Festive" className="input" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Colour Name</label><input {...register('colourName')} className="input" /></div>
            <div><label className="label">Colour Hex</label><input {...register('colourHex')} type="color" className="input h-10 p-1" /></div>
          </div>
          <div><label className="label">Tags</label><input {...register('tags')} placeholder="bridal, bestseller" className="input" /></div>
        </div>

        <div className="card space-y-4">
          <h2 className="font-display text-2xl font-medium text-secondary">Pricing & Stock</h2>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="label">Price (₹)</label><input {...register('price', { valueAsNumber: true })} type="number" className="input" /></div>
            <div><label className="label">MRP (₹)</label><input {...register('mrp', { valueAsNumber: true })} type="number" className="input" /></div>
            <div><label className="label">Stock</label><input {...register('stock', { valueAsNumber: true })} type="number" className="input" /></div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('inStock')} type="checkbox" className="accent-primary w-4 h-4" />
              <span className="text-sm font-semibold text-secondary">In Stock</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input {...register('isFeatured')} type="checkbox" className="accent-primary w-4 h-4" />
              <span className="text-sm font-semibold text-secondary">Featured</span>
            </label>
          </div>
        </div>

        <div className="flex gap-4">
          <button type="submit" disabled={isSubmitting || uploading} className="btn-primary h-12 px-8">
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost h-12">Cancel</button>
        </div>
      </form>
    </div>
  );
}
