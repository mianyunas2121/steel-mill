'use client';

import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm action',
  message = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  const btnClass = variant === 'danger' ? 'btn-danger' : 'btn-primary';

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-md bg-status-dangerBg flex items-center justify-center shrink-0">
          <AlertTriangle size={18} className="text-status-danger" />
        </div>
        <p className="text-sm text-ink-muted leading-relaxed pt-1">{message}</p>
      </div>
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="btn-outline" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </button>
        <button type="button" className={btnClass} onClick={onConfirm} disabled={loading}>
          {loading ? 'Working...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
