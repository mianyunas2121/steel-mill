'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-status-successBg border-line text-status-success',
    error: 'bg-status-dangerBg border-line text-status-danger',
    warning: 'bg-status-warningBg border-line text-status-warning',
    info: 'bg-status-infoBg border-line text-status-info',
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const Icon = icons[type] || CheckCircle;

  return (
    <div className="fixed top-4 right-4 z-toast toast-enter">
      <div
        className={`flex items-start gap-3 px-4 py-3 rounded-md border shadow-dropdown max-w-md bg-surface-raised ${styles[type]}`}
        role="status"
      >
        <Icon size={18} className="shrink-0 mt-0.5" strokeWidth={1.75} />
        <p className="text-sm flex-1 text-ink leading-snug">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 opacity-60 hover:opacity-100 text-ink transition-opacity"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
