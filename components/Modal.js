'use client';

import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-steel-950/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-white rounded-lg shadow-xl border border-steel-200 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-steel-200 sticky top-0 bg-white z-10">
          <h2 className="font-display text-lg text-steel-900 tracking-tight">{title}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-steel-100 rounded-md transition-colors">
            <X size={18} className="text-steel-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
