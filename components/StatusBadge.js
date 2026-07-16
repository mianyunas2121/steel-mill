'use client';

const VARIANTS = {
  success: {
    className: 'bg-status-successBg text-status-success',
    dot: 'bg-status-success',
  },
  warning: {
    className: 'bg-status-warningBg text-status-warning',
    dot: 'bg-status-warning',
  },
  danger: {
    className: 'bg-status-dangerBg text-status-danger',
    dot: 'bg-status-danger',
  },
  info: {
    className: 'bg-status-infoBg text-status-info',
    dot: 'bg-status-info',
  },
  neutral: {
    className: 'bg-surface-sunken text-ink-muted',
    dot: 'bg-ink-subtle',
  },
  brand: {
    className: 'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-300',
    dot: 'bg-brand-600',
  },
};

/** Map known domain statuses → badge variant */
export const STATUS_VARIANT = {
  PAID: 'success',
  ACTIVE: 'success',
  PARTIAL: 'warning',
  PENDING: 'danger',
  INACTIVE: 'neutral',
  INCOMING: 'info',
  OUTGOING: 'brand',
  OK: 'success',
  'LOW STOCK': 'warning',
  'OUT OF STOCK': 'danger',
};

export default function StatusBadge({ status, label, variant, showDot = true, className = '' }) {
  const resolved =
    variant || STATUS_VARIANT[String(status || '').toUpperCase()] || STATUS_VARIANT[status] || 'neutral';
  const style = VARIANTS[resolved] || VARIANTS.neutral;
  const text = label || status;

  return (
    <span className={`badge ${style.className} ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} aria-hidden />}
      {text}
    </span>
  );
}
