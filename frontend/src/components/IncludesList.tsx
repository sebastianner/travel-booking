import type { ReactNode } from 'react';
import { formatCurrency } from '@/lib/format';

export interface IncludeItem {
  icon: ReactNode;
  label: string;
  subtitle?: string;
  price: number;
}

interface IncludesListProps {
  items: IncludeItem[];
}

export function IncludesList({ items }: IncludesListProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Package includes</h2>
        <span className="text-xs text-slate-400">
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-900">{item.label}</div>
              {item.subtitle && <div className="text-xs text-slate-500">{item.subtitle}</div>}
            </div>
            <div className="text-sm font-semibold text-slate-900">{formatCurrency(item.price)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
