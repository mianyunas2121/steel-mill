'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import StatCard from '../../components/StatCard';
import { getDashboard } from '../../utils/api';
import { useAuth } from '../../utils/auth';
import { formatCurrency, formatCompactCurrency, STATUS_COLORS } from '../../utils/helpers';
import { format } from 'date-fns';
import {
  ArrowLeftRight,
  Package,
  TrendingUp,
  Users,
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
      <div className="mb-6">
        <p className="text-steel-500 text-sm">
          Operations overview for today and the current billing period.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Today's Transactions"
              value={data.todayTransactions}
              icon={ArrowLeftRight}
              color="blue"
            />
            <StatCard
              title="Month Revenue"
              value={formatCurrency(data.monthRevenue)}
              icon={TrendingUp}
              color="green"
            />
            <StatCard
              title="Inventory Value"
              value={formatCurrency(data.inventoryValue)}
              icon={Package}
              color="amber"
            />
            <StatCard
              title="Total Customers"
              value={data.totalCustomers}
              icon={Users}
              color="steel"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
            <div className="card p-5">
              <h3 className="font-medium text-steel-800 mb-4">Revenue Trend (30 Days)</h3>
              <div className="h-64">
                {data.revenueChart?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.revenueChart}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f766e" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => formatCompactCurrency(v)} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0f766e"
                        fill="url(#revGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-steel-400 text-sm">
                    No revenue data yet
                  </div>
                )}
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-medium text-steel-800 mb-4">Inventory by Material</h3>
              <div className="h-64">
                {data.inventoryStatus?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.inventoryStatus}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e9ef" />
                      <XAxis dataKey="materialType" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => `${v} KG`} />
                      <Bar dataKey="currentStock" fill="#334155" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-steel-400 text-sm">
                    No inventory data
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-steel-800">Top Customers</h3>
                <Link href="/customers" className="text-xs text-accent hover:underline">
                  View all
                </Link>
              </div>
              {data.topCustomers?.length > 0 ? (
                <div className="space-y-3">
                  {data.topCustomers.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-steel-100 text-steel-600 text-xs flex items-center justify-center font-medium">
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-steel-800 truncate">{c.name}</p>
                      </div>
                      <p className="text-sm font-semibold text-steel-900">
                        {formatCurrency(c.totalAmount)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-steel-400">No customer data yet</p>
              )}
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-steel-800">Recent Transactions</h3>
                <Link href="/transactions" className="text-xs text-accent hover:underline">
                  View all
                </Link>
              </div>
              {data.recentTransactions?.length > 0 ? (
                <div className="space-y-3">
                  {data.recentTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center gap-3">
                      <span className={`badge ${STATUS_COLORS[t.type]}`}>{t.type}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-steel-800 truncate">
                          {t.customerName}
                        </p>
                        <p className="text-xs text-steel-400">
                          {t.invoiceNumber} · {t.materialType}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(t.totalBill)}</p>
                        <p className="text-xs text-steel-400">
                          {format(new Date(t.createdAt), 'dd MMM')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-steel-400">No transactions yet</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <p className="text-steel-500">Failed to load dashboard</p>
      )}
    </AppLayout>
  );
}
