'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiPatch } from '../../../lib/api';
import { useAddresses, useOrders, useProfile, useWishlist } from '../../../lib/account';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { dateLabel, errorMessage } from '../../../lib/format';
import { Field, PageHeader, SectionTitle, Spinner } from '../../../components/ui';

const SUPPORT = 'hello@panchalii.in';

const nameSchema = z.object({ name: z.string().trim().min(2, 'Enter your name').max(60, 'Keep it under 60 characters') });

const passwordSchema = (hasPassword: boolean) =>
  z
    .object({
      current: hasPassword ? z.string().min(1, 'Enter your current password') : z.string().optional(),
      password: z.string().min(8, 'Use at least 8 characters'),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ['confirm'] })
    .refine((v) => !hasPassword || v.password !== v.current, { message: 'Choose a password different from your current one', path: ['password'] });

export default function ProfilePage() {
  const { data: profile } = useProfile();
  const { data: orders } = useOrders();
  const { data: wishlist } = useWishlist();
  const { data: addresses } = useAddresses();
  const user = useAuthStore((s) => s.user);
  const name = profile?.name ?? user?.name ?? '';

  const stats = [
    { label: 'Orders', value: orders?.length, href: '/account/orders' },
    { label: 'Saved sarees', value: wishlist?.length, href: '/account/wishlist' },
    { label: 'Addresses', value: addresses?.length, href: '/account/addresses' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Your account"
        title={<>Namaste, {name.split(' ')[0]}</>}
        subtitle={profile?.createdAt ? `Member since ${dateLabel(profile.createdAt)}` : undefined}
      />

      <div className="grid grid-cols-3 gap-px bg-[rgba(201,169,110,0.2)] border border-[rgba(201,169,110,0.2)] mb-14">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="bg-[#0F1A0F] px-5 py-6 hover:bg-[#13201a] transition-colors">
            <p className="text-[10px] uppercase tracking-[0.22em] text-cream-muted">{s.label}</p>
            <p className="font-display text-4xl text-cream mt-2 leading-none">{s.value ?? '–'}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-14">
        <DetailsForm profile={profile} fallbackName={name} />
        <PasswordForm key={String(profile?.hasPassword ?? true)} hasPassword={profile?.hasPassword ?? true} />
      </div>
    </div>
  );
}

function DetailsForm({ profile, fallbackName }: { profile?: { name: string; email?: string; phone?: string }; fallbackName: string }) {
  const qc = useQueryClient();
  const updateUser = useAuthStore((s) => s.updateUser);
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<{ name: string }>({ resolver: zodResolver(nameSchema), defaultValues: { name: fallbackName } });

  useEffect(() => { if (profile?.name) reset({ name: profile.name }); }, [profile?.name, reset]);
  const changed = (watch('name') ?? '').trim() !== (profile?.name ?? fallbackName);

  const onSubmit = async ({ name }: { name: string }) => {
    try {
      await apiPatch('/me/profile', { name });
      updateUser({ name });
      await qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Your details are saved');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <section>
      <SectionTitle number="01" title="Personal Details" />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <Field label="Email" value={profile?.email ?? ''} disabled readOnly name="email-display" />
        <Field label="Mobile number" value={profile?.phone ? `+91 ${profile.phone}` : 'Not added'} disabled readOnly name="phone-display" />
        <p className="text-xs text-cream-muted/80 leading-relaxed">
          To change your email or mobile number, write to <a className="text-gold underline underline-offset-4" href={`mailto:${SUPPORT}`}>{SUPPORT}</a>. We verify these to keep your account safe.
        </p>
        <button type="submit" disabled={!changed || isSubmitting} className="btn-secondary w-full h-12">
          {isSubmitting ? <Spinner /> : 'Save details →'}
        </button>
      </form>
    </section>
  );
}

function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const setAuth = useAuthStore((s) => s.setAuth);
  const user = useAuthStore((s) => s.user);
  const [schema] = useState(() => passwordSchema(hasPassword));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<{ current?: string; password: string; confirm: string }>({ resolver: zodResolver(schema) as any });

  const onSubmit = async (v: { current?: string; password: string; confirm: string }) => {
    try {
      const res = await apiPatch<{ tokens?: Parameters<typeof setAuth>[1] }>('/me/change-password', { ...(hasPassword && { currentPassword: v.current }), newPassword: v.password });
      // Other devices are signed out; keep this browser signed in with the new tokens
      if (res.tokens && user) setAuth(user, res.tokens);
      reset({ current: '', password: '', confirm: '' });
      toast.success(hasPassword ? 'Password updated. Other devices have been signed out.' : 'Password set. You can now sign in with your email.');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <section>
      <SectionTitle number="02" title={hasPassword ? 'Change Password' : 'Set a Password'} />
      <p className="text-xs text-cream-muted -mt-2 mb-5">
        {hasPassword ? 'Changing your password signs you out on your other devices.' : 'You signed up with Google. Add a password to also sign in with your email.'}
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {hasPassword && <Field label="Current password" type="password" autoComplete="current-password" error={errors.current?.message} {...register('current')} />}
        <Field label="New password" type="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-12">
          {isSubmitting ? <Spinner /> : hasPassword ? 'Update password →' : 'Set password →'}
        </button>
      </form>
    </section>
  );
}
