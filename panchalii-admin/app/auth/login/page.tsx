'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiPost } from '../../../lib/api';
import { useAdminAuthStore } from '../../../lib/auth.store';
import BrandMark from '../../../components/BrandMark';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
type LoginForm = z.infer<typeof schema>;

// Same wine velvet folds as the store's entry curtain, as a static backdrop
const VELVET =
  'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.65) 100%), ' +
  'repeating-linear-gradient(90deg, #1c080b 0px, #34121a 14px, #4f1f27 38px, #5b2a30 50px, #46191f 66px, #2a0d13 86px, #1c080b 100px)';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAuth } = useAdminAuthStore();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: LoginForm) => {
    try {
      const { user, tokens } = await apiPost<{ user: { _id: string; name: string; email: string; role: string }; tokens: { access: { token: string } } }>(
        '/public/auth/login', values
      );
      if (user.role !== 'admin') { toast.error('Access denied — admin only'); return; }
      setAuth(user, tokens.access.token);
      router.push('/dashboard');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: VELVET }}>
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <BrandMark className="h-[150px] w-auto" />
          <p className="eyebrow mt-4">Admin Panel</p>
        </div>
        <div className="bg-sidebar/95 border border-border backdrop-blur-sm px-10 py-10 shadow-2xl shadow-black/50">
          <h1 className="font-display text-3xl text-secondary text-center">Sign In</h1>
          <div className="flex items-center justify-center gap-3 mt-3 mb-8" aria-hidden="true">
            <span className="w-10 h-px bg-primary/50" />
            <span className="w-1.5 h-1.5 rotate-45 bg-primary" />
            <span className="w-10 h-px bg-primary/50" />
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <input id="email" {...register('email')} type="email" autoComplete="email" placeholder="admin@panchalii.in" className="input" />
              {errors.email && <p className="text-xs text-error mt-1.5">{errors.email.message}</p>}
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" {...register('password')} type="password" autoComplete="current-password" placeholder="••••••••" className="input" />
              {errors.password && <p className="text-xs text-error mt-1.5">{errors.password.message}</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full h-12 mt-3">
              {isSubmitting ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>
        </div>
        <p className="text-center text-[10px] uppercase tracking-[0.3em] text-tertiary/50 mt-8">Timeless · Ethical · Exquisite</p>
      </div>
    </div>
  );
}
