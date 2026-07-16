'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Toast from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import MetricValue from '../../components/MetricValue';
import { TableSkeleton } from '../../components/Skeleton';
import { getInventory, getInventoryTrend } from '../../utils/api';
import { formatCurrency, formatWeight, formatNumber } from '../../utils/helpers';
import { format } from 'date-fns';
import { AlertTriangle, Download, Package } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([getInventory(), getInventoryTrend()])
      .then(([invRes, trendRes]) => {
        setInventory(invRes.data.data || []);
        setTrend(trendRes.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      const headers = 'Material Type,Current Stock (KG),Price/KG,Value,Last Updated,Status\n';
      const rows = inventory
        .map((i) => {
          const status = i.isOutOfStock ? 'Out of Stock' : i.isLowStock ? 'Low Stock' : 'OK';
          return `${i.materialType},${i.currentStock},${i.pricePerKG},${i.value},${format(new Date(i.lastUpdated), 'yyyy-MM-dd')},${status}`;
        })
        .join('\n');
      const blob = new Blob([headers + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Inventory exported successfully', type: 'success' });
    } catch {
      setToast({ message: 'Export failed', type: 'error' });
    }
  };

  const lowStockItems = inventory.filter((i) => i.isLowStock || i.isOutOfStock);

  const stockStatus = (item) => {
    if (item.isOutOfStock) return { status: 'OUT OF STOCK', label: 'Out of Stock' };
    if (item.isLowStock) return { status: 'LOW STOCK', label: 'Low Stock' };
    return { status: 'OK', label: 'In Stock' };
  };

  return (
    <AppLayout title="Inventory" subtitle="Material stock levels and movement">
      <div className="toolbar">
        <p className="text-sm text-ink-subtle">
          <span className="tabular-nums font-medium text-ink">{inventory.length}</span> materials tracked
        </p>
        <button onClick={handleExport} className="btn-outline">
          <Download size={15} /> Export CSV
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-4 p-3.5 bg-status-warningBg border border-line rounded-md flex items-start gap-3">
          <AlertTriangle className="text-status-warning shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-semibold text-sm text-status-warning">Low stock alert</p>
            <p className="text-sm text-ink-muted mt-0.5">
              {lowStockItems.map((i) => `${i.materialType} (${formatWeight(i.currentStock)})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : inventory.length === 0 ? (
        <div className="card">
          <EmptyState icon={Package} title="No inventory records" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
            {inventory.map((item) => {
              const st = stockStatus(item);
              return (
                <div key={item.id} className="card p-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-1.5 bg-surface rounded-md border border-line shrink-0">
                        <Package size={14} className="text-ink-muted" />
                      </div>
                      <h3 className="text-sm font-semibold text-ink truncate">{item.materialType}</h3>
                    </div>
                    <StatusBadge status={st.status} label={st.label === 'In Stock' ? 'OK' : st.label} />
                  </div>
                  <MetricValue value={formatNumber(item.currentStock, 1)} unit="KG" size="lg" />
                  <p className="text-xs text-ink-subtle mt-2 tabular-nums">{formatCurrency(item.value)}</p>
                </div>
              );
            })}
          </div>

          <div className="table-wrap mb-5">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Type</th>
                  <th className="num">Current Stock</th>
                  <th className="num">Price/KG</th>
                  <th className="num">Value</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const st = stockStatus(item);
                  return (
                    <tr key={item.id}>
                      <td className="font-medium text-ink">{item.materialType}</td>
                      <td className="num">{formatWeight(item.currentStock)}</td>
                      <td className="num">{formatCurrency(item.pricePerKG)}</td>
                      <td className="num font-semibold text-ink">{formatCurrency(item.value)}</td>
                      <td className="tabular-nums whitespace-nowrap text-ink-subtle">
                        {format(new Date(item.lastUpdated), 'dd MMM yyyy HH:mm')}
                      </td>
                      <td>
                        <StatusBadge status={st.status} label={st.label} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {trend.length > 0 && (
            <div className="card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Inventory Movement</h3>
                <span className="text-2xs text-ink-subtle uppercase tracking-wider">30 days · KG</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => v.slice(5)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incoming" stroke="#047857" strokeWidth={2} name="Incoming (KG)" dot={false} />
                    <Line type="monotone" dataKey="outgoing" stroke="#1e40af" strokeWidth={2} name="Outgoing (KG)" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
