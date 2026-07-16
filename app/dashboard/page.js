'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { StatCardSkeleton } from '../../components/Skeleton';
import { getDashboard } from '../../utils/api';
import { useAuth } from '../../utils/auth';
import { formatCurrency, formatCompactCurrency, formatNumber } from '../../utils/helpers';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  Package,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';

const CHART = {
  brand: '#1e40af',
  grid: '#e2e8f0',
  muted: '#64748b',
  bar: '#334155',
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout title="Dashboard" subtitle={`Signed in as ${user?.name} · Amounts in PKR`}>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Today's Transactions"
              value={formatNumber(data.todayTransactions, 0)}
              icon={ArrowLeftRight}
              color="blue"
              subtitle="Gate & weighbridge activity"
            />
            <StatCard
              title="Month Revenue"
              value={formatCurrency(data.monthRevenue)}
              icon={TrendingUp}
              color="green"
              subtitle="Current billing period"
            />
            <StatCard
              title="Inventory Value"
              value={formatCurrency(data.inventoryValue)}
              icon={Package}
              color="amber"
              subtitle="Stock at current rates"
            />
            <StatCard
              title="Total Customers"
              value={formatNumber(data.totalCustomers, 0)}
              icon={Users}
              color="steel"
              subtitle="Active accounts"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Revenue Trend</h3>
                <span className="text-2xs text-ink-subtle uppercase tracking-wider">30 days</span>
              </div>
              <div className="h-64">
                {data.revenueChart?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueChart}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART.brand} stopOpacity={0.25} />
                          <stop offset="100%" stopColor={CHART.brand} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: CHART.muted }}
                        tickFormatter={(v) => v.slice(5)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: CHART.muted }}
                        tickFormatter={(v) => formatCompactCurrency(v)}
                        axisLine={false}
                        tickLine={false}
                        width={56}
                      />
                      <Tooltip
                        formatter={(v) => [formatCurrency(v), 'Revenue']}
                        contentStyle={{
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke={CHART.brand}
                        fill="url(#revGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="No revenue data" description="Transactions will appear here once recorded." />
                )}
              </div>
            </div>

            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Inventory by Material</h3>
                <span className="text-2xs text-ink-subtle uppercase tracking-wider">KG</span>
              </div>
              <div className="h-64">
                {data.inventoryStatus?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.inventoryStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART.grid} vertical={false} />
                      <XAxis
                        dataKey="materialType"
                        tick={{ fontSize: 11, fill: CHART.muted }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: CHART.muted }}
                        axisLine={false}
                        tickLine={false}
                        width={48}
                      />
                      <Tooltip
                        formatter={(v) => [`${formatNumber(v, 2)} KG`, 'Stock']}
                        contentStyle={{
                          borderRadius: 6,
                          border: '1px solid #e2e8f0',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="currentStock" fill={CHART.bar} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={Package} title="No inventory data" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-line">
                <h3 className="section-title">Top Customers</h3>
                <Link href="/customers" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  View all
                </Link>
              </div>
              {data.topCustomers?.length > 0 ? (
                <div className="divide-y divide-line">
                  {data.topCustomers.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-surface transition-colors">
                      <span className="w-6 h-6 rounded-md bg-surface-sunken text-ink-muted text-2xs flex items-center justify-center font-semibold tabular-nums">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{c.name}</p>
                      </div>
                      <p className="text-sm font-semibold text-ink tabular-nums">
                        {formatCurrency(c.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No customer data yet" />
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-line">
                <h3 className="section-title">Recent Transactions</h3>
                <Link href="/transactions" className="text-xs font-medium text-brand-600 hover:text-brand-700">
                  View all
                </Link>
              </div>
              {data.recentTransactions?.length > 0 ? (
                <div className="divide-y divide-line">
                  {data.recentTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-surface transition-colors">
                      <StatusBadge status={t.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{t.customerName}</p>
                        <p className="text-2xs text-ink-subtle tabular-nums mt-0.5">
                          {t.invoiceNumber} · {t.materialType}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold tabular-nums text-ink">
                          {formatCurrency(t.totalBill)}
                        </p>
                        <p className="text-2xs text-ink-subtle mt-0.5">
                          {format(new Date(t.createdAt), 'dd MMM')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon={Activity} title="No transactions yet" />
              )}
            </div>
          </div>
        </>
      ) : (
        <EmptyState title="Failed to load dashboard" description="Check your connection and try again." />
      )}
    </AppLayout>
  );
}
