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
import { formatCurrency, STATUS_COLORS } from '../../utils/helpers';
import { format } from 'date-fns';
import { Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../../utils/auth';

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

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await deleteCustomer(id);
      setToast({ message: 'Customer deleted', type: 'success' });
      load(search);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    }
  };

  return (
    <AppLayout title="Customers">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-steel-400" size={16} />
          <input
            className="input pl-9"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {hasRole('ADMIN', 'STAFF', 'ACCOUNTANT') && (
          <button onClick={openAdd} className="btn-primary">
            <Plus size={16} /> Add Customer
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Orders</th>
                <th>Total Amount</th>
                <th>Balance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-steel-400 py-8">No customers found</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <button onClick={() => openDetail(c)} className="font-medium text-accent hover:underline text-left">
                        {c.name}
                      </button>
                      {c.gstNumber && <p className="text-xs text-steel-400">GST: {c.gstNumber}</p>}
                    </td>
                    <td>
                      <p>{c.contactNumber || '—'}</p>
                      <p className="text-xs text-steel-400">{c.email || ''}</p>
                    </td>
                    <td>{c.totalOrders || 0}</td>
                    <td>{formatCurrency(c.totalAmount || 0)}</td>
                    <td className={c.balance > 0 ? 'text-red-600 font-medium' : ''}>
                      {formatCurrency(c.balance)}
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openDetail(c)} className="btn-ghost p-1.5" title="View">
                          <Eye size={16} />
                        </button>
                        {hasRole('ADMIN', 'STAFF', 'ACCOUNTANT') && (
                          <button onClick={() => openEdit(c)} className="btn-ghost p-1.5" title="Edit">
                            <Edit2 size={16} />
                          </button>
                        )}
                        {hasRole('ADMIN') && (
                          <button onClick={() => handleDelete(c.id)} className="btn-ghost p-1.5 text-red-500" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name *</label>
            <input className="input" {...register('name', { required: 'Name is required', minLength: 2 })} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Contact Number</label>
              <input className="input" {...register('contactNumber')} />
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
              <input className="input" {...register('gstNumber')} />
            </div>
            <div>
              <label className="label">Tax ID</label>
              <input className="input" {...register('taxId')} />
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="p-3 bg-steel-50 rounded-lg">
                <p className="text-xs text-steel-400">Contact</p>
                <p className="text-sm font-medium">{detail.contactNumber || '—'}</p>
              </div>
              <div className="p-3 bg-steel-50 rounded-lg">
                <p className="text-xs text-steel-400">Email</p>
                <p className="text-sm font-medium truncate">{detail.email || '—'}</p>
              </div>
              <div className="p-3 bg-steel-50 rounded-lg">
                <p className="text-xs text-steel-400">Orders</p>
                <p className="text-sm font-medium">{detail.totalOrders || detailTx.length}</p>
              </div>
              <div className="p-3 bg-steel-50 rounded-lg">
                <p className="text-xs text-steel-400">Balance</p>
                <p className="text-sm font-medium text-red-600">{formatCurrency(detail.balance)}</p>
              </div>
            </div>
            {detail.address && <p className="text-sm text-steel-500 mb-4">{detail.address}</p>}
            <h4 className="font-medium mb-3">Transaction History</h4>
            <div className="table-wrap max-h-80 overflow-y-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Material</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailTx.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-steel-400 py-4">No transactions</td></tr>
                  ) : (
                    detailTx.map((t) => (
                      <tr key={t.id}>
                        <td className="text-accent">{t.invoiceNumber}</td>
                        <td>{format(new Date(t.invoiceDate), 'dd MMM yyyy')}</td>
                        <td><span className={`badge ${STATUS_COLORS[t.type]}`}>{t.type}</span></td>
                        <td>{t.materialType}</td>
                        <td>{formatCurrency(t.totalBill)}</td>
                        <td><span className={`badge ${STATUS_COLORS[t.paymentStatus]}`}>{t.paymentStatus}</span></td>
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
