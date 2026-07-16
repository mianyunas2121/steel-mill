'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AppLayout from '../../components/AppLayout';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerTransactions,
} from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { format } from 'date-fns';
import { Plus, Search, Edit2, Trash2, Eye, Users } from 'lucide-react';
import { useAuth } from '../../utils/auth';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import { TableSkeleton } from '../../components/Skeleton';

export default function CustomersPage() {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailTx, setDetailTx] = useState([]);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const load = async (q = '') => {
    try {
      const res = await getCustomers({ search: q || undefined });
      setCustomers(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const openAdd = () => {
    setEditing(null);
    reset({ name: '', contactNumber: '', email: '', address: '', gstNumber: '', taxId: '' });
    setModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    reset({
      name: c.name,
      contactNumber: c.contactNumber || '',
      email: c.email || '',
      address: c.address || '',
      gstNumber: c.gstNumber || '',
      taxId: c.taxId || '',
    });
    setModal(true);
  };

  const openDetail = async (c) => {
    setDetail(c);
    try {
      const res = await getCustomerTransactions(c.id);
      setDetailTx(res.data.data || []);
    } catch {
      setDetailTx([]);
    }
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateCustomer(editing.id, data);
        setToast({ message: 'Customer updated successfully', type: 'success' });
      } else {
        await createCustomer(data);
        setToast({ message: 'Customer created successfully', type: 'success' });
      }
      setModal(false);
      load(search);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteId);
      setToast({ message: 'Customer deleted', type: 'success' });
      setDeleteId(null);
      load(search);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppLayout title="Customers" subtitle="Customer accounts and receivables">
      <div className="toolbar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-subtle" size={15} />
          <input
            className="input pl-9"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {hasRole('ADMIN', 'STAFF', 'ACCOUNTANT') && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={15} /> Add Customer
          </button>
        )}
      </div>

      {loading ? (
        <TableSkeleton rows={6} cols={6} />
      ) : customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title="No customers found"
            description="Add a customer to start recording transactions."
            action={
              hasRole('ADMIN', 'STAFF', 'ACCOUNTANT') ? (
                <button onClick={openAdd} className="btn-primary btn-sm">
                  <Plus size={14} /> Add Customer
                </button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th className="num">Orders</th>
                <th className="num">Total Amount</th>
                <th className="num">Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <button
                      onClick={() => openDetail(c)}
                      className="font-medium text-brand-600 hover:text-brand-700 text-left"
                    >
                      {c.name}
                    </button>
                    {c.gstNumber && (
                      <p className="text-2xs text-ink-subtle tabular-nums mt-0.5">GST: {c.gstNumber}</p>
                    )}
                  </td>
                  <td>
                    <p className="tabular-nums">{c.contactNumber || '—'}</p>
                    <p className="text-2xs text-ink-subtle">{c.email || ''}</p>
                  </td>
                  <td className="num">{c.totalOrders || 0}</td>
                  <td className="num">{formatCurrency(c.totalAmount || 0)}</td>
                  <td className={`num font-medium ${c.balance > 0 ? 'text-status-danger' : ''}`}>
                    {formatCurrency(c.balance)}
                  </td>
                  <td>
                    <div className="flex gap-0.5">
                      <button onClick={() => openDetail(c)} className="btn-ghost p-1.5" title="View">
                        <Eye size={15} />
                      </button>
                      {hasRole('ADMIN', 'STAFF', 'ACCOUNTANT') && (
                        <button onClick={() => openEdit(c)} className="btn-ghost p-1.5" title="Edit">
                          <Edit2 size={15} />
                        </button>
                      )}
                      {hasRole('ADMIN') && (
                        <button
                          onClick={() => setDeleteId(c.id)}
                          className="btn-ghost p-1.5 text-status-danger"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete customer"
        message="This will soft-delete the customer. Historical transactions are retained. Continue?"
        confirmLabel="Delete"
        loading={deleting}
      />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" {...register('name', { required: 'Name is required', minLength: 2 })} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Number</label>
              <input className="input tabular-nums" {...register('contactNumber')} />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" className="input" {...register('email')} />
            </div>
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} {...register('address')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">GST Number</label>
              <input className="input tabular-nums" {...register('gstNumber')} />
            </div>
            <div>
              <label className="label">Tax ID</label>
              <input className="input tabular-nums" {...register('taxId')} />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.name || 'Customer'} size="xl">
        {detail && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              <div className="p-3 bg-surface rounded-md border border-line">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Contact</p>
                <p className="text-sm font-medium tabular-nums mt-1">{detail.contactNumber || '—'}</p>
              </div>
              <div className="p-3 bg-surface rounded-md border border-line">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Email</p>
                <p className="text-sm font-medium truncate mt-1">{detail.email || '—'}</p>
              </div>
              <div className="p-3 bg-surface rounded-md border border-line">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Orders</p>
                <p className="text-sm font-semibold tabular-nums mt-1">{detail.totalOrders || detailTx.length}</p>
              </div>
              <div className="p-3 bg-surface rounded-md border border-line">
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Balance</p>
                <p className="text-sm font-semibold tabular-nums text-status-danger mt-1">
                  {formatCurrency(detail.balance)}
                </p>
              </div>
            </div>
            {detail.address && <p className="text-sm text-ink-muted mb-4">{detail.address}</p>}
            <h4 className="section-title mb-3">Transaction History</h4>
            <div className="table-wrap max-h-80 overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Material</th>
                    <th className="num">Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailTx.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center text-ink-subtle py-6">
                        No transactions
                      </td>
                    </tr>
                  ) : (
                    detailTx.map((t) => (
                      <tr key={t.id}>
                        <td className="text-brand-600 tabular-nums">{t.invoiceNumber}</td>
                        <td className="tabular-nums whitespace-nowrap">
                          {format(new Date(t.invoiceDate), 'dd MMM yyyy')}
                        </td>
                        <td>
                          <StatusBadge status={t.type} />
                        </td>
                        <td>{t.materialType}</td>
                        <td className="num">{formatCurrency(t.totalBill)}</td>
                        <td>
                          <StatusBadge status={t.paymentStatus} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
