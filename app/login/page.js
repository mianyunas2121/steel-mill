'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { login, getApiErrorMessage } from '../../utils/api';
import { useAuth } from '../../utils/auth';
import { Factory, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Toast from '../../components/Toast';
import { PageLoader } from '../../components/Skeleton';

export default function LoginPage() {
  const { loginUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [hostTip, setHostTip] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    const host = window.location.hostname;
    if (host.includes('vercel.app')) {
      setHostTip('vercel');
    } else if (host === 'localhost' || host === '127.0.0.1') {
      setHostTip('localhost');
    } else if (/^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) {
      setHostTip('lan');
    }
  }, []);

  useEffect(() => {
    if (mounted && !loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [mounted, loading, isAuthenticated, router]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const res = await login(data);
      if (res.data.success) {
        loginUser(res.data.data.user, res.data.data.token);
        setToast({ message: 'Login successful', type: 'success' });
        router.push('/dashboard');
      }
    } catch (err) {
      setToast({
        message: getApiErrorMessage(err, 'Login failed'),
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <PageLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-surface">
      <div className="hidden lg:flex lg:w-[46%] relative bg-steel-900 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 15% 10%, rgba(30,64,175,0.45) 0%, transparent 50%), linear-gradient(165deg, #0f172a 0%, #1e293b 55%, #172554 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 40px), repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 40px)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-brand-600 flex items-center justify-center shadow-xs">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-base tracking-tight">SMMS</h1>
              <p className="text-2xs text-slate-400 uppercase tracking-[0.16em]">Steel Mill Management</p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-brand-300 text-2xs font-semibold uppercase tracking-[0.16em] mb-3">
              Enterprise Operations Platform
            </p>
            <h2 className="text-3xl xl:text-4xl text-white font-semibold leading-tight tracking-tight mb-4">
              Production control for steel mill operations
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Inventory, weighbridge transactions, waste billing, receivables, and reports — built for plant
              supervisors and commercial staff.
            </p>
            <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
              <ShieldCheck size={16} className="text-brand-300" />
              Role-based access · Secure JWT sessions
            </div>
          </div>

          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Steel Mill Management System · Currency: PKR
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-md bg-brand-600 flex items-center justify-center">
              <Factory className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-ink text-sm">SMMS</h1>
              <p className="text-2xs text-ink-subtle uppercase tracking-widest">Operations</p>
            </div>
          </div>

          <div className="card p-6 sm:p-7">
            <h2 className="text-xl font-semibold text-ink tracking-tight mb-1">Sign in</h2>
            <p className="text-ink-subtle text-sm mb-6">Enter your staff credentials to continue</p>

            {hostTip === 'vercel' && (
              <div className="mb-5 p-3 rounded-md border border-status-success bg-status-successBg text-xs text-status-success leading-relaxed">
                Live cloud login — this site connects to the Railway API. Works from any phone with internet.
              </div>
            )}
            {hostTip === 'localhost' && (
              <div className="mb-5 p-3 rounded-md border border-line bg-surface text-xs text-ink-muted leading-relaxed">
                <p className="font-semibold text-ink mb-1">Phone login (same Wi‑Fi)</p>
                <p>
                  On mobile open{' '}
                  <span className="tabular-nums font-semibold text-ink">http://192.168.1.164:3000</span> — not the
                  Vercel URL, and not localhost.
                </p>
              </div>
            )}
            {hostTip === 'lan' && (
              <div className="mb-5 p-3 rounded-md border border-status-success bg-status-successBg text-xs text-status-success leading-relaxed">
                Connected via Wi‑Fi IP — login will use the API on this same PC.
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="admin@steelmill.com"
                  autoComplete="username"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                  })}
                />
                {errors.email && <p className="field-error">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className={`input pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-subtle hover:text-ink transition-colors"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="field-error">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-2.5 mt-1">
                {submitting ? 'Authenticating...' : 'Sign in'}
              </button>
            </form>
          </div>

          <div className="mt-4 p-3.5 rounded-md border border-line bg-surface-raised text-xs text-ink-subtle space-y-1">
            <p className="font-semibold text-ink-muted mb-1.5 text-2xs uppercase tracking-wider">Demo access</p>
            <p className="tabular-nums">Admin — admin@steelmill.com / admin123</p>
            <p className="tabular-nums">Staff — staff@steelmill.com / staff123</p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
