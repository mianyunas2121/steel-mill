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
import { formatCurrency, formatWeight, STATUS_COLORS } from '../../utils/helpers';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
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

const COLORS = ['#0f766e', '#334155', '#059669', '#d97706', '#0369a1', '#475569'];

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
    <AppLayout title="Reports">
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-start sm:items-center justify-between">
        <div className="flex gap-1 bg-steel-100 p-1 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white text-steel-900 shadow-sm' : 'text-steel-500 hover:text-steel-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-3 items-center">
          {tab === 'daily' && (
            <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
          {tab === 'monthly' && (
            <input type="month" className="input w-auto" value={month} onChange={(e) => setMonth(e.target.value)} />
          )}
          {tab === 'customer' && (
            <select className="input w-auto min-w-[200px]" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
          <button onClick={handleExport} className="btn-outline" disabled={!data}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data ? (
        <div className="card p-12 text-center text-steel-400">
          {tab === 'customer' && !customerId ? 'Select a customer to view report' : 'No data available'}
        </div>
      ) : (
        <>
          {/* Summary cards */}
          {tab === 'daily' && data.summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="card p-4">
                <p className="text-xs text-steel-400">Transactions</p>
                <p className="text-xl font-semibold">{data.summary.totalTransactions}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-steel-400">Incoming Total</p>
                <p className="text-xl font-semibold">{formatCurrency(data.summary.incomingTotal)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-steel-400">Outgoing Total</p>
                <p className="text-xl font-semibold">{formatCurrency(data.summary.outgoingTotal)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-steel-400">Weight Out</p>
                <p className="text-xl font-semibold">{formatWeight(data.summary.totalWeightOut)}</p>
              </div>
            </div>
          )}

          {tab === 'monthly' && data.summary && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card p-4">
                  <p className="text-xs text-steel-400">Revenue</p>
                  <p className="text-xl font-semibold text-emerald-600">{formatCurrency(data.summary.revenue)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-steel-400">Expenses</p>
                  <p className="text-xl font-semibold text-red-600">{formatCurrency(data.summary.expenses)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-steel-400">Profit</p>
                  <p className={`text-xl font-semibold ${data.summary.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(data.summary.profit)}
                  </p>
                </div>
                <div className="card p-4">
                  <p className="text-xs text-steel-400">Transactions</p>
                  <p className="text-xl font-semibold">{data.summary.totalTransactions}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                {data.dailyRevenue?.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-medium mb-4">Daily Revenue</h3>
                    <div className="h-56">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.dailyRevenue}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e4e9ef" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(8)} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v) => formatCurrency(v)} />
                          <Bar dataKey="amount" fill="#0f766e" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
                {data.materialSales?.length > 0 && (
                  <div className="card p-5">
                    <h3 className="font-medium mb-4">Material-wise Sales</h3>
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
                <p className="text-xs text-steel-400">Total Orders</p>
                <p className="text-xl font-semibold">{data.summary.totalOrders}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-steel-400">Total Billed</p>
                <p className="text-xl font-semibold">{formatCurrency(data.summary.totalBilled)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-steel-400">Total Paid</p>
                <p className="text-xl font-semibold text-emerald-600">{formatCurrency(data.summary.totalPaid)}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-steel-400">Outstanding</p>
                <p className="text-xl font-semibold text-red-600">{formatCurrency(data.summary.outstanding)}</p>
              </div>
            </div>
          )}

          {tab === 'material' && data.materials && (
            <div className="table-wrap mb-6">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Incoming Weight</th>
                    <th>Outgoing Weight</th>
                    <th>Incoming Amount</th>
                    <th>Outgoing Amount</th>
                    <th>Transactions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.materials.map((m) => (
                    <tr key={m.materialType}>
                      <td className="font-medium">{m.materialType}</td>
                      <td>{formatWeight(m.incomingWeight)}</td>
                      <td>{formatWeight(m.outgoingWeight)}</td>
                      <td>{formatCurrency(m.incomingAmount)}</td>
                      <td>{formatCurrency(m.outgoingAmount)}</td>
                      <td>{m.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Transactions table */}
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
                    <th>Weight</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.transactions.length === 0 ? (
                    <tr><td colSpan={8} className="text-center text-steel-400 py-6">No transactions</td></tr>
                  ) : (
                    data.transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="text-accent">{t.invoiceNumber}</td>
                        <td>{format(new Date(t.invoiceDate), 'dd MMM yyyy')}</td>
                        <td><span className={`badge ${STATUS_COLORS[t.type]}`}>{t.type}</span></td>
                        <td>{t.customer?.name || '—'}</td>
                        <td>{t.materialType}</td>
                        <td>{formatWeight(t.weight)}</td>
                        <td>{formatCurrency(t.totalBill)}</td>
                        <td><span className={`badge ${STATUS_COLORS[t.paymentStatus]}`}>{t.paymentStatus}</span></td>
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
