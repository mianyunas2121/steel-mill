'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import AppLayout from '../../components/AppLayout';
import Toast from '../../components/Toast';
import { useAuth } from '../../utils/auth';
import { changePassword } from '../../utils/api';
import { ROLE_LABELS } from '../../utils/helpers';
import { format } from 'date-fns';
import { LogOut, User } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      setToast({ message: 'Passwords do not match', type: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setToast({ message: 'Password changed successfully', type: 'success' });
      reset();
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to change password', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout title="Profile">
      <div className="max-w-xl space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-steel-800 flex items-center justify-center text-2xl text-white font-medium">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl text-steel-900">{user?.name}</h2>
              <p className="text-steel-500 text-sm">{user?.email}</p>
              <span className="badge bg-accent/10 text-accent mt-1">{ROLE_LABELS[user?.role] || user?.role}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-steel-400">Role</p>
              <p className="font-medium">{ROLE_LABELS[user?.role]}</p>
            </div>
            <div>
              <p className="text-steel-400">Status</p>
              <p className="font-medium">{user?.status}</p>
            </div>
            {user?.createdAt && (
              <div>
                <p className="text-steel-400">Member Since</p>
                <p className="font-medium">{format(new Date(user.createdAt), 'dd MMM yyyy')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-medium text-steel-800 mb-4">Change Password</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" {...register('currentPassword', { required: true })} />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                {...register('newPassword', { required: true, minLength: { value: 6, message: 'Min 6 characters' } })}
              />
              {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" {...register('confirmPassword', { required: true })} />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <button onClick={logout} className="btn-danger w-full sm:w-auto">
          <LogOut size={16} /> Logout
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
