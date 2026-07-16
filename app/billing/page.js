'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppLayout from '../../components/AppLayout';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import InvoiceView from '../../components/InvoiceView';
import {
  getTransactions,
  getInvoice,
  createPayment,
  getPayments,
  getSettings,
} from '../../utils/api';
import { formatCurrency, STATUS_COLORS } from '../../utils/helpers';
import { format } from 'date-fns';
import { Search } from 'lucide-react';
import { useAuth } from '../../utils/auth';

export default function BillingPage() {
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [settings, setSettings] = useState(null);
  const [payments, setPayments] = useState([]);
  const [payModal, setPayModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset } = useForm({
    defaultValues: { paymentMethod: 'CASH', paymentDate: format(new Date(), 'yyyy-MM-dd') },
  });

  useEffect(() => {
    getSettings().then((r) => setSettings(r.data.data)).catch(console.error);
    loadTransactions();
  }, []);

  const loadTransactions = async (q = '') => {
    setLoading(true);
    try {
      const res = await getTransactions({ search: q || undefined, limit: 50 });
      setTransactions(res.data.data.transactions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadTransactions(search);
  };

  const openInvoice = async (tx) => {
    try {
      const res = await getInvoice(tx.invoiceNumber);
      setSelected(res.data.data);
      const payRes = await getPayments({ invoiceId: tx.id });
      setPayments(payRes.data.data || []);
    } catch {
      setSelected(tx);
    }
  };

  const openPayment = () => {
    if (!selected) return;
    const remaining = selected.totalBill - (selected.paidAmount || 0);
    reset({
      amount: remaining,
      paymentMethod: 'CASH',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
    });
    setPayModal(true);
  };

  const onPayment = async (data) => {
    setSubmitting(true);
    try {
      await createPayment({
        customerId: selected.customerId || selected.customer?.id,
        amount: parseFloat(data.amount),
        paymentMethod: data.paymentMethod,
        invoiceId: selected.id,
        paymentDate: data.paymentDate,
        notes: data.notes || null,
      });
      setToast({ message: 'Payment recorded successfully', type: 'success' });
      setPayModal(false);
      const res = await getInvoice(selected.invoiceNumber);
      setSelected(res.data.data);
      loadTransactions(search);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Payment failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Billing & Invoices">
      <form onSubmit={handleSearch} className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search by invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Type</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-steel-400 py-8">No invoices found</td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="font-medium text-accent">{t.invoiceNumber}</td>
                    <td>{format(new Date(t.invoiceDate), 'dd MMM yyyy')}</td>
                    <td>{t.customer?.name}</td>
                    <td><span className={`badge ${STATUS_COLORS[t.type]}`}>{t.type}</span></td>
                    <td>{formatCurrency(t.totalBill)}</td>
                    <td>{formatCurrency(t.paidAmount)}</td>
                    <td><span className={`badge ${STATUS_COLORS[t.paymentStatus]}`}>{t.paymentStatus}</span></td>
                    <td>
                      <button onClick={() => openInvoice(t)} className="btn-outline text-xs py-1 px-2">
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <InvoiceView
          transaction={selected}
          settings={settings}
          onClose={() => setSelected(null)}
          onRecordPayment={
            hasRole('ADMIN', 'ACCOUNTANT', 'STAFF') && selected.paymentStatus !== 'PAID'
              ? openPayment
              : null
          }
        />
      )}

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Record Payment">
        <form onSubmit={handleSubmit(onPayment)} className="space-y-4">
          <div className="p-3 bg-steel-50 rounded-lg text-sm mb-2">
            <p>Invoice: <strong>{selected?.invoiceNumber}</strong></p>
            <p>Total: {formatCurrency(selected?.totalBill)} | Paid: {formatCurrency(selected?.paidAmount)}</p>
            <p className="text-red-600 font-medium">
              Due: {formatCurrency((selected?.totalBill || 0) - (selected?.paidAmount || 0))}
            </p>
          </div>
          <div>
            <label className="label">Amount (PKR)</label>
            <input type="number" step="0.01" className="input" {...register('amount', { required: true, min: 0.01 })} />
          </div>
          <div>
            <label className="label">Payment Method</label>
            <select className="input" {...register('paymentMethod')}>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <div>
            <label className="label">Payment Date</label>
            <input type="date" className="input" {...register('paymentDate')} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} {...register('notes')} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setPayModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
