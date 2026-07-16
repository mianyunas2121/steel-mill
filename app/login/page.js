'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { login } from '../../utils/api';
import { useAuth } from '../../utils/auth';
import { Factory, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import Toast from '../../components/Toast';

export default function LoginPage() {
  const { loginUser, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    setMounted(true);
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
        message: err.response?.data?.message || 'Login failed',
        type: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || loading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steel-100">
        <div className="w-9 h-9 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-steel-100">
      <div className="hidden lg:flex lg:w-[48%] relative bg-steel-900 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 20% 20%, rgba(15,118,110,0.35) 0%, transparent 45%), linear-gradient(160deg, #0f172a 0%, #1e293b 100%)',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 48px), repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 48px)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-md bg-accent flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-semibold text-lg tracking-tight">SMMS</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em]">Steel Mill Management</p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="text-accent-light text-xs font-semibold uppercase tracking-[0.18em] mb-3">
              Enterprise Operations
            </p>
            <h2 className="font-display text-4xl text-white leading-tight mb-4">
              Inventory, billing &amp; control — in one workspace
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              Track incoming and outgoing material, apply waste rules accurately, and manage receivables in PKR.
            </p>
            <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
              <ShieldCheck size={16} className="text-accent-light" />
              Role-based access · Secure JWT sessions
            </div>
          </div>

          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} Steel Mill Management System · Currency: PKR
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-steel-900">SMMS</h1>
              <p className="text-[10px] text-steel-400 uppercase tracking-widest">Operations</p>
            </div>
          </div>

          <div className="card p-7 sm:p-8">
            <h2 className="font-display text-2xl text-steel-900 mb-1">Sign in</h2>
            <p className="text-steel-500 text-sm mb-7">Use your staff credentials to access the system</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="admin@steelmill.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
                  })}
                />
                {errors.email && <p className="text-rose-600 text-xs mt-1.5">{errors.email.message}</p>}
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="input pr-10"
                    placeholder="Enter password"
                    {...register('password', { required: 'Password is required' })}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-steel-400 hover:text-steel-600"
                    onClick={() => setShowPass(!showPass)}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-600 text-xs mt-1.5">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={submitting} className="btn-primary w-full py-3 mt-1">
                {submitting ? 'Authenticating...' : 'Sign in to workspace'}
              </button>
            </form>
          </div>

          <div className="mt-5 p-4 rounded-md border border-steel-200 bg-white text-xs text-steel-500 space-y-1">
            <p className="font-semibold text-steel-600 mb-1.5">Demo access</p>
            <p>Admin — admin@steelmill.com / admin123</p>
            <p>Staff — staff@steelmill.com / staff123</p>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
