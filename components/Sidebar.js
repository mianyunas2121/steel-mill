'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../utils/auth';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Users,
  Package,
  FileText,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Factory,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const NAV_SECTIONS = [
  {
    title: 'Operations',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
      { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
      { href: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
    ],
  },
  {
    title: 'Commercial',
    items: [
      { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
      { href: '/billing', label: 'Billing', icon: FileText, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
      { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin', label: 'Administration', icon: Settings, roles: ['ADMIN'] },
      { href: '/profile', label: 'Profile', icon: User, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
    ],
  },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const NavContent = () => (
    <>
      <div className="px-5 py-5 border-b border-[var(--sidebar-border)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-brand-600 flex items-center justify-center shadow-xs">
            <Factory className="w-4.5 h-4.5 text-white" size={18} />
          </div>
          <div className="min-w-0">
            <h1 className="text-ink-inverse font-semibold tracking-tight text-sm leading-tight">SMMS</h1>
            <p className="text-2xs text-[var(--sidebar-muted)] uppercase tracking-[0.14em] mt-0.5">
              Mill Operations
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter((item) => hasRole(...item.roles));
          if (!items.length) return null;
          return (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--sidebar-muted)]">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={`group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                        active
                          ? 'bg-[var(--sidebar-active)] text-white font-medium shadow-xs'
                          : 'text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-white'
                      }`}
                    >
                      <Icon size={16} strokeWidth={1.75} className="shrink-0 opacity-90" />
                      <span className="flex-1 truncate">{item.label}</span>
                      {active && <ChevronRight size={14} className="opacity-70" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 p-3 rounded-md bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-md bg-brand-700 text-brand-200 flex items-center justify-center text-xs font-semibold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate font-medium leading-tight">{user?.name}</p>
            <p className="text-2xs text-[var(--sidebar-muted)] uppercase tracking-wide mt-0.5">
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-[var(--sidebar-text)] hover:text-white hover:bg-[var(--sidebar-hover)] rounded-md transition-colors border border-white/10"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[var(--surface-overlay)] z-sidebar backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-sidebar w-[var(--sidebar-width)] bg-[var(--sidebar-bg)] flex flex-col
          transform transition-transform duration-200 no-print border-r border-[var(--sidebar-border)]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <NavContent />
      </aside>
    </>
  );
}

export function MobileMenuButton({ open, onToggle }) {
  return (
    <button
      className="lg:hidden p-2 rounded-md text-ink-muted hover:bg-surface-sunken hover:text-ink transition-colors"
      onClick={onToggle}
      aria-label="Toggle menu"
    >
      {open ? <X size={18} /> : <Menu size={18} />}
    </button>
  );
}
