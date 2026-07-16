'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import AppLayout from '../../components/AppLayout';
import Modal from '../../components/Modal';
import Toast from '../../components/Toast';
import { useAuth } from '../../utils/auth';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
  getPricing,
  createPricing,
  getSettings,
  updateSettings,
  exportAllData,
} from '../../utils/api';
import { formatCurrency, ROLE_LABELS, STATUS_COLORS } from '../../utils/helpers';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, Key, Download } from 'lucide-react';

export default function AdminPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [settings, setSettings] = useState({});
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const userForm = useForm();
  const priceForm = useForm();
  const settingsForm = useForm();
  const resetForm = useForm();

  useEffect(() => {
    if (!hasRole('ADMIN')) {
      router.replace('/dashboard');
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAll = async () => {
    try {
      const [u, p, s] = await Promise.all([getUsers(), getPricing({}), getSettings()]);
      setUsers(u.data.data || []);
      setPricing(p.data.data || []);
      setSettings(s.data.data || {});
      settingsForm.reset(s.data.data || {});
    } catch (err) {
      console.error(err);
    }
  };

  const openAddUser = () => {
    setEditing(null);
    userForm.reset({ name: '', email: '', password: '', role: 'STAFF' });
    setModal('user');
  };

  const openEditUser = (u) => {
    setEditing(u);
    userForm.reset({ name: u.name, email: u.email, role: u.role, status: u.status, password: '' });
    setModal('user');
  };

  const onUserSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editing) {
        const payload = { name: data.name, email: data.email, role: data.role, status: data.status };
        if (data.password) payload.password = data.password;
        await updateUser(editing.id, payload);
        setToast({ message: 'User updated successfully', type: 'success' });
      } else {
        await createUser(data);
        setToast({ message: 'User created successfully', type: 'success' });
      }
      setModal(null);
      loadAll();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await deleteUser(id);
      setToast({ message: 'User deactivated', type: 'success' });
      loadAll();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    }
  };

  const onResetPassword = async (data) => {
    setSubmitting(true);
    try {
      await resetUserPassword(editing.id, { newPassword: data.newPassword });
      setToast({ message: 'Password reset successfully', type: 'success' });
      setModal(null);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const onPriceSubmit = async (data) => {
    setSubmitting(true);
    try {
      await createPricing({
        materialType: data.materialType,
        pricePerKG: parseFloat(data.pricePerKG),
        validFrom: data.validFrom || undefined,
      });
      setToast({ message: 'Pricing updated successfully', type: 'success' });
      setModal(null);
      loadAll();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const onSettingsSubmit = async (data) => {
    setSubmitting(true);
    try {
      await updateSettings(data);
      setToast({ message: 'Settings saved successfully', type: 'success' });
      loadAll();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportData = async () => {
    try {
      const res = await exportAllData();
      const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smms-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setToast({ message: 'Data exported successfully', type: 'success' });
    } catch {
      setToast({ message: 'Export failed', type: 'error' });
    }
  };

  // Current prices only
  const currentPrices = {};
  pricing.forEach((p) => {
    if (!currentPrices[p.materialType] || new Date(p.validFrom) > new Date(currentPrices[p.materialType].validFrom)) {
      if (!p.validTo || new Date(p.validTo) >= new Date()) {
        currentPrices[p.materialType] = p;
      }
    }
  });

  const tabs = [
    { id: 'users', label: 'Users' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <AppLayout title="Admin Panel">
      <div className="flex gap-1 bg-steel-100 p-1 rounded-lg w-fit mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id ? 'bg-white text-steel-900 shadow-sm' : 'text-steel-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={openAddUser} className="btn-primary"><Plus size={16} /> Add User</button>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge bg-steel-100 text-steel-700">{ROLE_LABELS[u.role]}</span></td>
                    <td><span className={`badge ${STATUS_COLORS[u.status]}`}>{u.status}</span></td>
                    <td>{format(new Date(u.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEditUser(u)} className="btn-ghost p-1.5"><Edit2 size={16} /></button>
                        <button
                          onClick={() => { setEditing(u); resetForm.reset(); setModal('reset'); }}
                          className="btn-ghost p-1.5"
                          title="Reset Password"
                        >
                          <Key size={16} />
                        </button>
                        <button onClick={() => handleDeleteUser(u.id)} className="btn-ghost p-1.5 text-red-500">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'pricing' && (
        <>
          <div className="flex justify-between mb-4">
            <p className="text-sm text-steel-500">Current & historical material pricing</p>
            <button
              onClick={() => { priceForm.reset({ materialType: '', pricePerKG: '', validFrom: format(new Date(), 'yyyy-MM-dd') }); setModal('pricing'); }}
              className="btn-primary"
            >
              <Plus size={16} /> Set Price
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {Object.values(currentPrices).map((p) => (
              <div key={p.id} className="card p-4">
                <p className="text-sm text-steel-500">{p.materialType}</p>
                <p className="text-2xl font-semibold">{formatCurrency(p.pricePerKG)}<span className="text-sm font-normal text-steel-400">/KG</span></p>
                <p className="text-xs text-steel-400 mt-1">Since {format(new Date(p.validFrom), 'dd MMM yyyy')}</p>
              </div>
            ))}
          </div>
          <h3 className="font-medium mb-3">Price History</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Material</th>
                  <th>Price/KG</th>
                  <th>Valid From</th>
                  <th>Valid To</th>
                </tr>
              </thead>
              <tbody>
                {pricing.map((p) => (
                  <tr key={p.id}>
                    <td>{p.materialType}</td>
                    <td className="font-medium">{formatCurrency(p.pricePerKG)}</td>
                    <td>{format(new Date(p.validFrom), 'dd MMM yyyy')}</td>
                    <td>{p.validTo ? format(new Date(p.validTo), 'dd MMM yyyy') : 'Current'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'settings' && (
        <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="max-w-2xl space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-steel-800">Company Details</h3>
            <div>
              <label className="label">Company Name</label>
              <input className="input" {...settingsForm.register('companyName')} />
            </div>
            <div>
              <label className="label">Address</label>
              <textarea className="input" rows={2} {...settingsForm.register('companyAddress')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
              <label className="label">GST / NTN Number</label>
                <input className="input" {...settingsForm.register('companyGST')} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" {...settingsForm.register('companyPhone')} />
              </div>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" {...settingsForm.register('companyEmail')} />
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-steel-800">Bank Details</h3>
            <div>
              <label className="label">Bank Name</label>
              <input className="input" {...settingsForm.register('bankName')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Account Number</label>
                <input className="input" {...settingsForm.register('bankAccount')} />
              </div>
              <div>
                <label className="label">IFSC Code</label>
                <input className="input" {...settingsForm.register('bankIFSC')} />
              </div>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h3 className="font-medium text-steel-800">Other</h3>
            <div>
              <label className="label">Low Stock Threshold (KG)</label>
              <input type="number" className="input" {...settingsForm.register('lowStockThreshold')} />
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : 'Save Settings'}
            </button>
            <button type="button" onClick={handleExportData} className="btn-outline">
              <Download size={16} /> Export All Data
            </button>
          </div>
        </form>
      )}

      {/* User Modal */}
      <Modal open={modal === 'user'} onClose={() => setModal(null)} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" {...userForm.register('name', { required: true })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" {...userForm.register('email', { required: true })} />
          </div>
          <div>
            <label className="label">{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
            <input type="password" className="input" {...userForm.register('password', { required: !editing, minLength: 6 })} />
          </div>
          <div>
            <label className="label">Role</label>
            <select className="input" {...userForm.register('role')}>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="ACCOUNTANT">Accountant</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          {editing && (
            <div>
              <label className="label">Status</label>
              <select className="input" {...userForm.register('status')}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === 'reset'} onClose={() => setModal(null)} title={`Reset Password — ${editing?.name}`}>
        <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" {...resetForm.register('newPassword', { required: true, minLength: 6 })} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">Reset Password</button>
          </div>
        </form>
      </Modal>

      <Modal open={modal === 'pricing'} onClose={() => setModal(null)} title="Set Material Price">
        <form onSubmit={priceForm.handleSubmit(onPriceSubmit)} className="space-y-4">
          <div>
            <label className="label">Material Type</label>
            <input className="input" placeholder="e.g. Steel, Iron, Aluminum" {...priceForm.register('materialType', { required: true })} />
          </div>
          <div>
            <label className="label">Price per KG (PKR)</label>
            <input type="number" step="0.01" className="input" {...priceForm.register('pricePerKG', { required: true, min: 0.01 })} />
          </div>
          <div>
            <label className="label">Effective From</label>
            <input type="date" className="input" {...priceForm.register('validFrom')} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setModal(null)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">Set Price</button>
          </div>
        </form>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
