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
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
  { href: '/transactions', label: 'Transactions', icon: ArrowLeftRight, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
  { href: '/inventory', label: 'Inventory', icon: Package, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
  { href: '/billing', label: 'Billing', icon: FileText, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
  { href: '/admin', label: 'Administration', icon: Settings, roles: ['ADMIN'] },
  { href: '/profile', label: 'Profile', icon: User, roles: ['ADMIN', 'STAFF', 'ACCOUNTANT', 'VIEWER'] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const [open, setOpen] = useState(false);

  const filtered = navItems.filter((item) => hasRole(...item.roles));

  const NavContent = () => (
    <>
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-accent flex items-center justify-center shadow-sm">
            <Factory className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold tracking-tight text-base">SMMS</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.18em]">Operations</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-2">
        <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Main Menu
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-4">
        {filtered.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all ${
                active
                  ? 'bg-accent text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={17} className="shrink-0 opacity-90" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mx-3 mb-4 p-3 rounded-md bg-white/5 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-md bg-accent/20 text-accent-light flex items-center justify-center text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white truncate font-medium">{user?.name}</p>
            <p className="text-[11px] text-slate-400 uppercase tracking-wide">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-md transition-colors border border-white/10"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-steel-900 text-white rounded-md shadow-lg no-print"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {open && (
        <div className="lg:hidden fixed inset-0 bg-steel-950/50 z-40 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[260px] bg-steel-900 flex flex-col
          transform transition-transform duration-200 no-print border-r border-steel-800
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <NavContent />
      </aside>
    </>
  );
}
