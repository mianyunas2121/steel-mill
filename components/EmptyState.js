'use client';

import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There is nothing to display for the current filters.',
  action,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-14 px-6 text-center ${className}`}>
      <div className="w-12 h-12 rounded-md bg-surface-sunken border border-line flex items-center justify-center mb-4">
        <Icon size={22} className="text-ink-subtle" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="text-sm text-ink-subtle mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
