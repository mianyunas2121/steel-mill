'use client';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'accent' }) {
  const colors = {
    accent: 'bg-teal-50 text-accent border-teal-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    steel: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const bars = {
    accent: 'bg-accent',
    blue: 'bg-sky-600',
    green: 'bg-emerald-600',
    amber: 'bg-amber-500',
    steel: 'bg-steel-600',
  };

  return (
    <div className="card p-5 relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${bars[color]}`} />
      <div className="flex items-start justify-between pl-2">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-steel-500 mb-2">{title}</p>
          <p className="text-2xl font-semibold text-steel-900 tracking-tight truncate">{value}</p>
          {subtitle && <p className="text-xs text-steel-400 mt-1.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-md border ${colors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
