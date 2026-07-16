'use client';

/**
 * Production-friendly numeric display with optional muted unit.
 * Uses tabular-nums so columns align in tables and KPI cards.
 */
export default function MetricValue({
  value,
  unit,
  size = 'md',
  className = '',
  muted = false,
}) {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  return (
    <span
      className={`tabular-nums font-semibold ${sizes[size]} ${
        muted ? 'text-ink-muted' : 'text-ink'
      } ${className}`}
    >
      {value}
      {unit != null && unit !== '' && <span className="unit">{unit}</span>}
    </span>
  );
}
