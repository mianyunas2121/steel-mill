'use client';

import { useEffect, useState } from 'react';
import AppLayout from '../../components/AppLayout';
import Toast from '../../components/Toast';
import { getInventory, getInventoryTrend, exportReport } from '../../utils/api';
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
      // Export inventory as CSV client-side
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

  return (
    <AppLayout title="Inventory">
      <div className="flex justify-between items-center mb-6">
        <p className="text-steel-500 text-sm">{inventory.length} materials in stock</p>
        <button onClick={handleExport} className="btn-outline">
          <Download size={16} /> Export CSV
        </button>
      </div>

      {lowStockItems.length > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-amber-800">Low Stock Alert</p>
            <p className="text-sm text-amber-700 mt-1">
              {lowStockItems.map((i) => `${i.materialType} (${formatWeight(i.currentStock)})`).join(', ')}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            {inventory.map((item) => (
              <div key={item.id} className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-steel-100 rounded-lg">
                    <Package size={16} className="text-steel-600" />
                  </div>
                  <h3 className="font-medium text-steel-800">{item.materialType}</h3>
                </div>
                <p className="text-2xl font-semibold text-steel-900">{formatNumber(item.currentStock, 1)}</p>
                <p className="text-xs text-steel-400 mb-2">KG</p>
                <div className="flex justify-between text-sm">
                  <span className="text-steel-500">{formatCurrency(item.value)}</span>
                  {item.isOutOfStock ? (
                    <span className="badge bg-red-100 text-red-700">Out</span>
                  ) : item.isLowStock ? (
                    <span className="badge bg-amber-100 text-amber-700">Low</span>
                  ) : (
                    <span className="badge bg-emerald-100 text-emerald-700">OK</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="table-wrap mb-8">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material Type</th>
                  <th>Current Stock</th>
                  <th>Price/KG</th>
                  <th>Value</th>
                  <th>Last Updated</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.id}>
                    <td className="font-medium">{item.materialType}</td>
                    <td>{formatWeight(item.currentStock)}</td>
                    <td>{formatCurrency(item.pricePerKG)}</td>
                    <td className="font-medium">{formatCurrency(item.value)}</td>
                    <td>{format(new Date(item.lastUpdated), 'dd MMM yyyy HH:mm')}</td>
                    <td>
                      {item.isOutOfStock ? (
                        <span className="badge bg-red-100 text-red-700">Out of Stock</span>
                      ) : item.isLowStock ? (
                        <span className="badge bg-amber-100 text-amber-700">Low Stock</span>
                      ) : (
                        <span className="badge bg-emerald-100 text-emerald-700">In Stock</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {trend.length > 0 && (
            <div className="card p-5">
              <h3 className="font-medium text-steel-800 mb-4">Inventory Movement (30 Days)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e9ef" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="incoming" stroke="#059669" strokeWidth={2} name="Incoming (KG)" />
                    <Line type="monotone" dataKey="outgoing" stroke="#0f766e" strokeWidth={2} name="Outgoing (KG)" />
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
