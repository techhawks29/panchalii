'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiPost } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import AuthShell from '../../../components/AuthShell';
import { Field, Spinner } from '../../../components/ui';

const schema = z
  .object({ password: z.string().min(8, 'Use at least 8 characters'), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match", path: ['confirm'] });
type Form = z.infer<typeof schema>;

function ResetContent() {
  const token = useSearchParams().get('token');
  const [done, setDone] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ password }: Form) => {
    try {
      await apiPost('/public/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      toast.error(errorMessage(err, 'This reset link has expired. Please request a new one.'));
    }
  };

  if (!token) {
    return (
      <AuthShell eyebrow="Account help" title="Link Not Valid">
        <p className="text-sm text-cream-muted text-center leading-relaxed">This reset link is incomplete. Please use the link from your email, or request a new one.</p>
        <Link href="/auth/forgot-password" className="btn-secondary w-full h-12 mt-8">Request a new link</Link>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell eyebrow="All set" title="Password Updated">
        <p className="text-sm text-cream-muted text-center leading-relaxed">Your password has been changed and you&apos;ve been signed out on all devices. Sign in with your new password.</p>
        <Link href="/auth/login" className="btn-secondary w-full h-12 mt-8">Sign in →</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account help" title="New Password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="New password" type="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Field label="Confirm new password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...register('confirm')} />
        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full h-12 !mt-7">
          {isSubmitting ? <Spinner /> : 'Save new password →'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return <Suspense><ResetContent /></Suspense>;
}
