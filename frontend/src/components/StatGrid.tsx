interface Stat {
  label: string;
  value: string;
  emphasis?: 'default' | 'warning';
}

interface StatGridProps {
  stats: Stat[];
}

export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-slate-50 p-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">{stat.label}</div>
          <div className={`mt-1 text-lg font-bold ${stat.emphasis === 'warning' ? 'text-amber-600' : 'text-slate-900'}`}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}
