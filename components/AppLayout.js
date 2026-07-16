'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../utils/auth';
import { useTheme } from './ThemeProvider';
import Sidebar, { MobileMenuButton } from './Sidebar';
import { Moon, Sun, Bell, ChevronRight } from 'lucide-react';
import { PageLoader } from './Skeleton';

const LABELS = {
  dashboard: 'Dashboard',
  transactions: 'Transactions',
  customers: 'Customers',
  inventory: 'Inventory',
  billing: 'Billing',
  reports: 'Reports',
  admin: 'Administration',
  profile: 'Profile',
};

export default function AppLayout({ children, title, subtitle }) {
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, loading, isAuthenticated, router]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!mounted || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <PageLoader label="Loading workspace..." />
      </div>
    );
  }

  const crumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((seg, i, arr) => ({
      label: LABELS[seg] || seg,
      href: '/' + arr.slice(0, i + 1).join('/'),
      current: i === arr.length - 1,
    }));

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-header h-[var(--header-height)] bg-surface-raised/95 backdrop-blur border-b border-line no-print shadow-header">
          <div className="h-full px-4 sm:px-6 flex items-center gap-3 max-w-content">
            <MobileMenuButton open={mobileOpen} onToggle={() => setMobileOpen((v) => !v)} />

            <div className="flex-1 min-w-0">
              <nav className="hidden sm:flex items-center gap-1 text-2xs text-ink-subtle mb-0.5" aria-label="Breadcrumb">
                <Link href="/dashboard" className="hover:text-ink transition-colors">
                  Home
                </Link>
                {crumbs.map((c) => (
                  <span key={c.href} className="inline-flex items-center gap-1">
                    <ChevronRight size={12} className="opacity-50" />
                    {c.current ? (
                      <span className="text-ink-muted font-medium">{c.label}</span>
                    ) : (
                      <Link href={c.href} className="hover:text-ink transition-colors">
                        {c.label}
                      </Link>
                    )}
                  </span>
                ))}
              </nav>
              {title && (
                <h1 className="text-base sm:text-lg font-semibold text-ink tracking-tight truncate leading-tight">
                  {title}
                </h1>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-md text-ink-muted hover:bg-surface hover:text-ink transition-colors"
                aria-label="Toggle dark mode"
                title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button
                type="button"
                className="relative p-2 rounded-md text-ink-muted hover:bg-surface hover:text-ink transition-colors"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell size={16} />
              </button>
              <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-line">
                <div className="w-8 h-8 rounded-md bg-brand-600 text-white flex items-center justify-center text-xs font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="min-w-0 hidden md:block">
                  <p className="text-xs font-medium text-ink truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-2xs text-ink-subtle uppercase tracking-wide">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 overflow-x-hidden">
          {(subtitle || title) && subtitle && (
            <div className="px-4 sm:px-6 pt-4 max-w-content">
              <p className="page-subtitle">{subtitle}</p>
            </div>
          )}
          <div className="p-4 sm:p-6 max-w-content">{children}</div>
        </main>
      </div>
    </div>
  );
}
