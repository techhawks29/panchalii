'use client';
import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { apiPost } from '../../../lib/api';
import { useAuthStore } from '../../../lib/stores/auth.store';
import { useCartStore } from '../../../lib/stores/cart.store';
import { errorMessage } from '../../../lib/format';
import { safeNext } from '../../../lib/useAuthReady';
import AuthShell from '../../../components/AuthShell';
import { Field, Spinner } from '../../../components/ui';

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name').max(60, 'Keep it under 60 characters'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().regex(/^\d{10}$/, 'Enter a 10-digit mobile number'),
  password: z.string().min(8, 'Use at least 8 characters'),
});
const otpSchema = z.object({ otp: z.string().regex(/^\d{6}$/, 'Enter the 6-digit code') });

type RegisterForm = z.infer<typeof registerSchema>;
type OtpForm = z.infer<typeof otpSchema>;

function RegisterContent() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const setAuth = useAuthStore((s) => s.setAuth);
  const mergeCart = useCartStore((s) => s.mergeCart);
  const [step, setStep] = useState<'details' | 'code'>('details');
  const [details, setDetails] = useState<RegisterForm | null>(null);
  const [resending, setResending] = useState(false);

  const detailsForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });
  const codeForm = useForm<OtpForm>({ resolver: zodResolver(otpSchema) });

  const sendDetails = async (values: RegisterForm) => {
    await apiPost('/public/auth/register', values);
    setDetails(values);
    setStep('code');
    toast.success(`We sent a 6-digit code to ${values.email}`);
  };

  const onRegister = async (values: RegisterForm) => {
    try { await sendDetails(values); } catch (err) { toast.error(errorMessage(err, 'Could not create your account')); }
  };

  const resend = async () => {
    if (!details || resending) return;
    setResending(true);
    try { await sendDetails(details); } catch (err) { toast.error(errorMessage(err)); } finally { setResending(false); }
  };

  const onVerify = async ({ otp }: OtpForm) => {
    try {
      const res = await apiPost<{ user: Parameters<typeof setAuth>[0]; tokens: Parameters<typeof setAuth>[1] }>('/public/auth/verify-otp', { identifier: details?.email, otp });
      setAuth(res.user, res.tokens);
      await mergeCart();
      toast.success(`Welcome to Panchalii, ${res.user.name.split(' ')[0]}`);
      router.push(next);
    } catch (err) {
      toast.error(errorMessage(err, 'That code did not work'));
    }
  };

  if (step === 'code' && details) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = codeForm;
    return (
      <AuthShell eyebrow="One last step" title="Verify Email">
        <p className="text-sm text-cream-muted text-center leading-relaxed mb-7">
          Enter the code we sent to<br /><span className="text-cream font-semibold">{details.email}</span>
        </p>
        <form onSubmit={handleSubmit(onVerify)} className="space-y-5" noValidate>
          <div>
            <label htmlFor="otp" className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-cream-muted mb-2">6-digit code</label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="••••••"
              className={`input text-center font-display text-3xl tracking-[0.6em] ${errors.otp ? '!border-error' : ''}`}
              {...register('otp')}
            />
            {errors.otp && <p className="text-xs text-error mt-1.5">{errors.otp.message}</p>}
          </div>
          <button type="submit" disabled={isSubmitting} className="btn-secondary w-full h-12">
            {isSubmitting ? <Spinner /> : 'Verify & continue →'}
          </button>
        </form>
        <div className="flex justify-between mt-6 text-[10px] uppercase tracking-[0.2em]">
          <button onClick={() => setStep('details')} className="text-cream-muted hover:text-gold">← Change details</button>
          <button onClick={resend} disabled={resending} className="text-gold/80 hover:text-gold disabled:opacity-50">{resending ? 'Sending…' : 'Resend code'}</button>
        </div>
      </AuthShell>
    );
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = detailsForm;
  return (
    <AuthShell
      eyebrow="Join Panchalii"
      title="Create Account"
      footer={
        <p className="text-sm text-cream/70">
          Already have an account?{' '}
          <Link href={`/auth/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-gold hover:text-gold-light underline underline-offset-4">Sign in</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onRegister)} className="space-y-5" noValidate>
        <Field label="Full name" autoComplete="name" placeholder="As you would like to be addressed" error={errors.name?.message} {...register('name')} />
        <Field label="Email" type="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Field label="Mobile number" type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" error={errors.phone?.message} {...register('phone')} />
        <Field label="Password" type="password" autoComplete="new-password" placeholder="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full h-12 !mt-7">
          {isSubmitting ? <Spinner /> : 'Create account →'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return <Suspense><RegisterContent /></Suspense>;
}
