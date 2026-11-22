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

const schemas = {
  email: z.object({ identifier: z.string().trim().email('Enter a valid email address'), password: z.string().min(1, 'Enter your password') }),
  phone: z.object({ identifier: z.string().trim().regex(/^\d{10}$/, 'Enter a 10-digit mobile number'), password: z.string().min(1, 'Enter your password') }),
};
type Form = { identifier: string; password: string };

function LoginForm() {
  const [tab, setTab] = useState<'email' | 'phone'>('email');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const next = safeNext(useSearchParams().get('next'));
  const setAuth = useAuthStore((s) => s.setAuth);
  const mergeCart = useCartStore((s) => s.mergeCart);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schemas[tab]) });

  const onSubmit = async (values: Form) => {
    try {
      const res = await apiPost<{ user: Parameters<typeof setAuth>[0]; tokens: Parameters<typeof setAuth>[1] }>(
        tab === 'email' ? '/public/auth/login' : '/public/auth/login-phone',
        tab === 'email' ? { email: values.identifier, password: values.password } : { phone: values.identifier, password: values.password },
      );
      setAuth(res.user, res.tokens);
      await mergeCart();
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}`);
      router.push(next);
    } catch (err) {
      toast.error(errorMessage(err, 'Sign in failed'));
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Sign In"
      footer={
        <p className="text-sm text-cream/70">
          New to Panchalii?{' '}
          <Link href={`/auth/register${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-gold hover:text-gold-light underline underline-offset-4">Create an account</Link>
        </p>
      }
    >
      <div className="grid grid-cols-2 mb-7" role="tablist">
        {(['email', 'phone'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => { setTab(t); reset(); }}
            className={`py-3 text-[11px] font-semibold uppercase tracking-[0.25em] border-b transition-colors ${tab === t ? 'text-gold border-gold' : 'text-cream-muted/70 border-[rgba(201,169,110,0.25)] hover:text-cream'}`}
          >
            {t === 'email' ? 'Email' : 'Mobile'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <Field
          key={tab}
          label={tab === 'email' ? 'Email' : 'Mobile number'}
          type={tab === 'email' ? 'email' : 'tel'}
          inputMode={tab === 'email' ? 'email' : 'numeric'}
          autoComplete={tab === 'email' ? 'email' : 'tel-national'}
          placeholder={tab === 'email' ? 'you@example.com' : '10-digit mobile number'}
          error={errors.identifier?.message}
          {...register('identifier')}
        />
        <Field
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          error={errors.password?.message}
          trailing={
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-[10px] uppercase tracking-[0.15em] text-cream-muted hover:text-gold">
              {showPassword ? 'Hide' : 'Show'}
            </button>
          }
          {...register('password')}
        />
        <div className="text-right -mt-2">
          <Link href="/auth/forgot-password" className="text-[10px] uppercase tracking-[0.2em] text-gold/80 hover:text-gold">Forgot password?</Link>
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-secondary w-full h-12">
          {isSubmitting ? <Spinner /> : 'Sign in →'}
        </button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
