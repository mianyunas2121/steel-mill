'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Toast from '../../components/Toast';
import {
  getDailyReport,
  getMonthlyReport,
  getMaterialReport,
  getCustomers,
  getCustomerReport,
  exportReport,
} from '../../utils/api';
import { formatCurrency, formatWeight } from '../../utils/helpers';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { PageLoader } from '../../components/Skeleton';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#1e40af', '#334155', '#047857', '#b45309', '#1d4ed8', '#475569'];

export default function ReportsPage() {
  const [tab, setTab] = useState('daily');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [customerId, setCustomerId] = useState('');
  const [customers, setCustomers] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    getCustomers().then((r) => setCustomers(r.data.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, date, month, customerId]);

  const loadReport = async () => {
    setLoading(true);
    setData(null);
    try {
      let res;
      if (tab === 'daily') {
        res = await getDailyReport(date);
      } else if (tab === 'monthly') {
        res = await getMonthlyReport(month);
      } else if (tab === 'customer' && customerId) {
        res = await getCustomerReport(customerId);
      } else if (tab === 'material') {
        res = await getMaterialReport({});
      } else {
        setLoading(false);
        return;
      }
      setData(res.data.data);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load report', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const params = { format: 'excel', type: tab };
      if (tab === 'daily') params.date = date;
      if (tab === 'monthly') params.month = month;
      if (tab === 'customer') params.customerId = customerId;

      const res = await exportReport(params);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tab}-report.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Report exported successfully', type: 'success' });
    } catch {
      setToast({ message: 'Export failed', type: 'error' });
    }
  };

  const tabs = [
    { id: 'daily', label: 'Daily' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'customer', label: 'Customer' },
    { id: 'material', label: 'Material' },
  ];

  return (
    <AppLayout title="Reports" subtitle="Operational and commercial analytics">
      <div className="flex flex-col sm:flex-row gap-3 mb-5 items-start sm:items-center justify-between no-print">
        <div className="flex gap-0.5 bg-surface-sunken p-1 rounded-md border border-line">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                tab === t.id
                  ? 'bg-surface-raised text-ink shadow-xs'
                  : 'text-ink-subtle hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {tab === 'daily' && (
            <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
          {tab === 'monthly' && (
            <input type="month" className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
          )}
          {tab === 'customer' && (
            <select
              className="input w-auto min-w-[200px]"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={handleExport} className="btn-outline" disabled={!data}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Loading report..." />
      ) : !data ? (
        <div className="card">
          <EmptyState
            title={tab === 'customer' && !customerId ? 'Select a customer' : 'No data available'}
            description={
              tab === 'customer' && !customerId
                ? 'Choose a customer above to view their report.'
                : 'Nothing to show for the selected period.'
            }
          />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {tab === 'daily' && data.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Transactions</p>
                <p className="text-xl font-semibold tabular-nums mt-1">{data.summary.totalTransactions}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Incoming Total</p>
                <p className="text-xl font-semibold tabular-nums mt-1">{formatCurrency(data.summary.incomingTotal)}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Outgoing Total</p>
                <p className="text-xl font-semibold tabular-nums mt-1">{formatCurrency(data.summary.outgoingTotal)}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Weight Out</p>
                <p className="text-xl font-semibold tabular-nums mt-1">{formatWeight(data.summary.totalWeightOut)}</p>
              </div>
            </div>
          )}

          {tab === 'monthly' && data.summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                  <p className="text-2xs text-ink-subtle uppercase tracking-wider">Revenue</p>
                  <p className="text-xl font-semibold tabular-nums text-status-success mt-1">{formatCurrency(data.summary.revenue)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-2xs text-ink-subtle uppercase tracking-wider">Expenses</p>
                  <p className="text-xl font-semibold tabular-nums text-status-danger mt-1">{formatCurrency(data.summary.expenses)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-2xs text-ink-subtle uppercase tracking-wider">Profit</p>
                  <p className={`text-xl font-semibold tabular-nums mt-1 ${data.summary.profit >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                    {formatCurrency(data.summary.profit)}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-2xs text-ink-subtle uppercase tracking-wider">Transactions</p>
                  <p className="text-xl font-semibold tabular-nums mt-1">{data.summary.totalTransactions}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {data.dailyRevenue?.length > 0 && (
                  <div className="card p-5">
                    <h3 className="section-title mb-4">Daily Revenue</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => v.slice(8)} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Bar dataKey="amount" fill="#1e40af" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {data.materialSales?.length > 0 && (
                  <div className="card p-5">
                    <h3 className="section-title mb-4">Material-wise Sales</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={data.materialSales}
                            dataKey="amount"
                            nameKey="materialType"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ materialType }) => materialType}
                          >
                            {data.materialSales.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'customer' && data.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Total Orders</p>
                <p className="text-xl font-semibold tabular-nums mt-1">{data.summary.totalOrders}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Total Billed</p>
                <p className="text-xl font-semibold tabular-nums mt-1">{formatCurrency(data.summary.totalBilled)}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Total Paid</p>
                <p className="text-xl font-semibold tabular-nums text-status-success mt-1">{formatCurrency(data.summary.totalPaid)}</p>
              </div>
              <div className="card p-4">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Outstanding</p>
                <p className="text-xl font-semibold tabular-nums text-status-danger mt-1">{formatCurrency(data.summary.outstanding)}</p>
              </div>
            </div>
          )}

          {tab === 'material' && data.materials && (
            <div className="table-wrap mb-5">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th className="num">Incoming Weight</th>
                    <th className="num">Outgoing Weight</th>
                    <th className="num">Incoming Amount</th>
                    <th className="num">Outgoing Amount</th>
                    <th className="num">Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.materials.map((m) => (
                    <tr key={m.materialType}>
                      <td className="font-medium text-ink">{m.materialType}</td>
                      <td className="num">{formatWeight(m.incomingWeight)}</td>
                      <td className="num">{formatWeight(m.outgoingWeight)}</td>
                      <td className="num">{formatCurrency(m.incomingAmount)}</td>
                      <td className="num">{formatCurrency(m.outgoingAmount)}</td>
                      <td className="num">{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.transactions && (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Customer</th>
                    <th>Material</th>
                    <th className="num">Weight</th>
                    <th className="num">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center text-ink-subtle py-6">
                        No transactions
                      </td>
                    </tr>
                  ) : (
                    data.transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="text-brand-600 tabular-nums font-medium">{t.invoiceNumber}</td>
                        <td className="tabular-nums whitespace-nowrap">
                          {format(new Date(t.invoiceDate), 'dd MMM yyyy')}
                        </td>
                        <td>
                          <StatusBadge status={t.type} />
                        </td>
                        <td>{t.customer?.name || '—'}</td>
                        <td>{t.materialType}</td>
                        <td className="num">{formatWeight(t.weight)}</td>
                        <td className="num font-semibold">{formatCurrency(t.totalBill)}</td>
                        <td>
                          <StatusBadge status={t.paymentStatus} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
