'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../utils/auth';
import Sidebar from './Sidebar';

export default function AppLayout({ children, title, subtitle }) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-steel-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-steel-500 text-sm">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-steel-100">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {title && (
          <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-steel-200 px-4 sm:px-8 py-4 no-print shadow-header">
            <div className="ml-10 lg:ml-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent mb-0.5">
                Steel Mill Management
              </p>
              <h1 className="font-display text-xl sm:text-2xl text-steel-900 tracking-tight">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
          </header>
        )}
        <div className="p-4 sm:p-8 max-w-[1400px]">{children}</div>
      </main>
    </div>
  );
}
