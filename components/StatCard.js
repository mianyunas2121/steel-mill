'use client';

import MetricValue from './MetricValue';

const TONE = {
  brand: {
    bar: 'bg-brand-600',
    icon: 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900 dark:text-brand-300 dark:border-brand-800',
  },
  accent: {
    bar: 'bg-brand-600',
    icon: 'bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900 dark:text-brand-300 dark:border-brand-800',
  },
  blue: {
    bar: 'bg-status-info',
    icon: 'bg-status-infoBg text-status-info border-transparent',
  },
  green: {
    bar: 'bg-status-success',
    icon: 'bg-status-successBg text-status-success border-transparent',
  },
  amber: {
    bar: 'bg-status-warning',
    icon: 'bg-status-warningBg text-status-warning border-transparent',
  },
  steel: {
    bar: 'bg-steel-600',
    icon: 'bg-surface-sunken text-ink-muted border-line',
  },
  red: {
    bar: 'bg-status-danger',
    icon: 'bg-status-dangerBg text-status-danger border-transparent',
  },
};

export default function StatCard({
  title,
  value,
  unit,
  subtitle,
  icon: Icon,
  color = 'brand',
  trend,
}) {
  const tone = TONE[color] || TONE.brand;

  return (
    <div className="card p-4 sm:p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${tone.bar}`} />
      <div className="flex items-start justify-between pl-2.5 gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-semibold uppercase tracking-wider text-ink-subtle mb-2">
            {title}
          </p>
          <MetricValue value={value} unit={unit} size="lg" className="leading-none block truncate" />
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {trend && (
                <span
                  className={`text-2xs font-semibold tabular-nums ${
                    trend.direction === 'up'
                      ? 'text-status-success'
                      : trend.direction === 'down'
                        ? 'text-status-danger'
                        : 'text-ink-subtle'
                  }`}
                >
                  {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'}{' '}
                  {trend.label}
                </span>
              )}
              {subtitle && <p className="text-xs text-ink-subtle">{subtitle}</p>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-md border shrink-0 ${tone.icon}`}>
            <Icon size={16} strokeWidth={1.75} />
          </div>
        )}
      </div>
    </div>
  );
}
