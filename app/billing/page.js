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
import { formatCurrency } from '../../utils/helpers';
import { format } from 'date-fns';
import { Search, FileText } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { TableSkeleton } from '../../components/Skeleton';

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
    <AppLayout title="Billing & Invoices" subtitle="Invoice lookup and payment recording">
      <form onSubmit={handleSearch} className="toolbar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={15} />
          <input
            className="input pl-9"
            placeholder="Search by invoice number or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">
          Search
        </button>
      </form>

      {loading ? (
        <TableSkeleton rows={8} cols={8} />
      ) : transactions.length === 0 ? (
        <div className="card">
          <EmptyState icon={FileText} title="No invoices found" description="Try a different search, or create a transaction first." />
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
                <th className="num">Total</th>
                <th className="num">Paid</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td className="font-medium text-brand-600 tabular-nums">{t.invoiceNumber}</td>
                  <td className="tabular-nums whitespace-nowrap">
                    {format(new Date(t.invoiceDate), 'dd MMM yyyy')}
                  </td>
                  <td>{t.customer?.name}</td>
                  <td>
                    <StatusBadge status={t.type} />
                  </td>
                  <td className="num font-semibold text-ink">{formatCurrency(t.totalBill)}</td>
                  <td className="num">{formatCurrency(t.paidAmount)}</td>
                  <td>
                    <StatusBadge status={t.paymentStatus} />
                  </td>
                  <td>
                    <button onClick={() => openInvoice(t)} className="btn-outline btn-sm">
                      View
                    </button>
                  </td>
                </tr>
              ))}
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
          <div className="p-3.5 bg-surface rounded-md border border-line text-sm space-y-1">
            <p>
              Invoice: <strong className="tabular-nums">{selected?.invoiceNumber}</strong>
            </p>
            <p className="tabular-nums text-ink-muted">
              Total: {formatCurrency(selected?.totalBill)} · Paid: {formatCurrency(selected?.paidAmount)}
            </p>
            <p className="text-status-danger font-semibold tabular-nums">
              Due: {formatCurrency((selected?.totalBill || 0) - (selected?.paidAmount || 0))}
            </p>
          </div>
          <div>
            <label className="label">Amount (PKR)</label>
            <input
              type="number"
              step="0.01"
              className="input tabular-nums"
              {...register('amount', { required: true, min: 0.01 })}
            />
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
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setPayModal(false)} className="btn-outline">
              Cancel
            </button>
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
