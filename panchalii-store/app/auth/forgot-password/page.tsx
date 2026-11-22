'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiPost } from '../../../lib/api';
import { errorMessage } from '../../../lib/format';
import AuthShell from '../../../components/AuthShell';
import { Field, Spinner } from '../../../components/ui';

const schema = z.object({ email: z.string().trim().email('Enter a valid email address') });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async ({ email }: Form) => {
    try {
      await apiPost('/public/auth/forgot-password', { email });
      setSentTo(email);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const footer = <Link href="/auth/login" className="text-sm text-gold hover:text-gold-light underline underline-offset-4">← Back to sign in</Link>;

  if (sentTo) {
    return (
      <AuthShell eyebrow="Check your inbox" title="Link Sent" footer={footer}>
        <p className="text-sm text-cream-muted text-center leading-relaxed">
          If an account exists for <span className="text-cream font-semibold">{sentTo}</span>, we&apos;ve sent a link to reset your password.
          It expires in 15 minutes.
        </p>
        <button onClick={() => setSentTo(null)} className="btn-primary w-full h-12 mt-8">Use a different email</button>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Account help" title="Forgot Password" footer={footer}>
      <p className="text-sm text-cream-muted text-center leading-relaxed mb-7">Enter the email you signed up with and we&apos;ll send you a link to choose a new password.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full h-12">
          {isSubmitting ? <Spinner /> : 'Send reset link →'}
        </button>
      </form>
    </AuthShell>
  );
}
