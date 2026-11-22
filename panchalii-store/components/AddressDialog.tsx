'use client';
import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiPatch, apiPost } from '../lib/api';
import type { Address } from '../lib/account';
import { errorMessage } from '../lib/format';
import { Field, Spinner } from './ui';

const LABELS = ['Home', 'Work', 'Other'] as const;

const schema = z.object({
  label: z.enum(LABELS),
  name: z.string().trim().min(2, "Enter the recipient's name"),
  phone: z.string().trim().transform((v) => v.replace(/\D/g, '')).pipe(z.string().regex(/^\d{10}$/, 'Enter a 10-digit mobile number')),
  line1: z.string().trim().min(3, 'Enter your flat, house or building'),
  line2: z.string().trim().optional(),
  city: z.string().trim().min(2, 'Enter city'),
  state: z.string().trim().min(2, 'Enter state'),
  pincode: z.string().trim().regex(/^\d{6}$/, '6-digit pincode'),
  isDefault: z.boolean(),
});
type Form = z.input<typeof schema>;

/** Add or edit an address in a dialog. Resolves through onSaved with the saved address. */
export default function AddressDialog({ open, onClose, existing, defaultName, onSaved }: {
  open: boolean;
  onClose: () => void;
  existing?: Address | null;
  defaultName?: string;
  onSaved?: (a: Address) => void;
}) {
  const qc = useQueryClient();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const editingDefault = !!existing?.isDefault;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open) {
      reset({
        label: (LABELS as readonly string[]).includes(existing?.label || '') ? (existing!.label as Form['label']) : 'Home',
        name: existing?.name ?? defaultName ?? '',
        phone: existing?.phone ?? '',
        line1: existing?.line1 ?? '',
        line2: existing?.line2 ?? '',
        city: existing?.city ?? '',
        state: existing?.state ?? '',
        pincode: existing?.pincode ?? '',
        isDefault: existing ? existing.isDefault : true,
      });
      if (!d.open) d.showModal();
    } else if (d.open) d.close();
  }, [open, existing, defaultName, reset]);

  const onSubmit = async (raw: Form) => {
    const values = schema.parse(raw);
    try {
      const res = existing
        ? await apiPatch<{ data: Address }>(`/me/addresses/${existing._id}`, { ...values, isDefault: values.isDefault || undefined })
        : await apiPost<{ data: Address }>('/me/addresses', values);
      await qc.invalidateQueries({ queryKey: ['addresses'] });
      toast.success(existing ? 'Address updated' : 'Address saved');
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save this address'));
    }
  };

  const label = watch('label');
  const isDefault = watch('isDefault');

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-xl bg-[#0F1A0F] text-cream border border-[rgba(201,169,110,0.3)] p-0 backdrop:bg-black/70 shadow-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="p-7 sm:p-9 max-h-[90vh] overflow-y-auto" noValidate>
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="label-eyebrow mb-2">{existing ? 'Edit address' : 'New address'}</p>
            <h2 className="font-display text-cream text-3xl">Where shall we deliver?</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-cream-muted hover:text-gold text-2xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-6" role="radiogroup" aria-label="Address label">
          {LABELS.map((l) => (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={label === l}
              onClick={() => setValue('label', l)}
              className={`h-10 text-[10px] font-semibold uppercase tracking-[0.2em] border transition-colors ${label === l ? 'border-gold text-gold bg-gold/10' : 'border-[rgba(201,169,110,0.25)] text-cream-muted hover:text-cream'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
          <Field label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="For delivery updates" error={errors.phone?.message} {...register('phone')} />
          <Field className="sm:col-span-2" label="Flat, house, building" autoComplete="address-line1" error={errors.line1?.message} {...register('line1')} />
          <Field className="sm:col-span-2" label="Area, landmark (optional)" autoComplete="address-line2" {...register('line2')} />
          <Field label="City" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
          <Field label="Pincode" inputMode="numeric" autoComplete="postal-code" error={errors.pincode?.message} {...register('pincode')} />
          <Field className="sm:col-span-2" label="State" autoComplete="address-level1" error={errors.state?.message} {...register('state')} />
        </div>

        {!editingDefault && (
          <label className="flex items-center gap-3 mt-6 cursor-pointer select-none">
            <input type="checkbox" className="sr-only peer" checked={!!isDefault} onChange={(e) => setValue('isDefault', e.target.checked)} />
            <span className="w-[18px] h-[18px] border border-gold flex items-center justify-center peer-checked:bg-gold peer-focus-visible:ring-2 peer-focus-visible:ring-gold/50">
              {isDefault && <svg className="w-3 h-3 text-[#0F1A0F]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>}
            </span>
            <span className="text-sm text-cream-muted">Use as my default address</span>
          </label>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8">
          <button type="button" onClick={onClose} className="btn-primary sm:flex-1 h-12">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="btn-secondary sm:flex-1 h-12">
            {isSubmitting ? <Spinner /> : existing ? 'Save changes →' : 'Save address →'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
