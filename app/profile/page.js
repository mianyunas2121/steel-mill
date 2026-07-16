'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import AppLayout from '../../components/AppLayout';
import Toast from '../../components/Toast';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../utils/auth';
import { changePassword } from '../../utils/api';
import { ROLE_LABELS } from '../../utils/helpers';
import { format } from 'date-fns';
import { LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

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
    <AppLayout title="Profile" subtitle="Account details and security">
      <div className="max-w-xl space-y-4">
        <div className="card p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-md bg-brand-600 flex items-center justify-center text-xl text-white font-semibold">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-ink tracking-tight">{user?.name}</h2>
              <p className="text-ink-subtle text-sm">{user?.email}</p>
              <div className="mt-1.5">
                <StatusBadge status="ACTIVE" label={ROLE_LABELS[user?.role] || user?.role} variant="brand" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm border-t border-line pt-4">
            <div>
              <p className="text-2xs text-ink-subtle uppercase tracking-wider">Role</p>
              <p className="font-medium text-ink mt-0.5">{ROLE_LABELS[user?.role]}</p>
            </div>
            <div>
              <p className="text-2xs text-ink-subtle uppercase tracking-wider">Status</p>
              <p className="font-medium text-ink mt-0.5">{user?.status}</p>
            </div>
            {user?.createdAt && (
              <div>
                <p className="text-2xs text-ink-subtle uppercase tracking-wider">Member Since</p>
                <p className="font-medium text-ink mt-0.5 tabular-nums">
                  {format(new Date(user.createdAt), 'dd MMM yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="section-title mb-4">Change Password</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input"
                {...register('currentPassword', { required: true })}
              />
            </div>
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                {...register('newPassword', {
                  required: true,
                  minLength: { value: 6, message: 'Min 6 characters' },
                })}
              />
              {errors.newPassword && <p className="field-error">{errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input
                type="password"
                className="input"
                {...register('confirmPassword', { required: true })}
              />
            </div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        <button onClick={logout} className="btn-danger w-full sm:w-auto">
          <LogOut size={15} /> Sign out
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  );
}
