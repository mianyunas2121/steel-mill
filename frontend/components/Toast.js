'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const Icon = icons[type] || CheckCircle;

  return (
    <div className="fixed top-4 right-4 z-[60] animate-in slide-in-from-top">
      <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-md ${styles[type]}`}>
        <Icon size={20} className="shrink-0 mt-0.5" />
        <p className="text-sm flex-1">{message}</p>
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
