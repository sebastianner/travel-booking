import type { ReactNode } from 'react';

export type BadgeTone = 'green' | 'amber' | 'red' | 'gray' | 'blue';

interface BadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  dot?: boolean;
}

const TONE_CLASSES: Record<BadgeTone, string> = {
  green: 'bg-emerald-50 text-emerald-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
  gray: 'bg-slate-100 text-slate-500',
  blue: 'bg-blue-50 text-blue-700',
};

const DOT_CLASSES: Record<BadgeTone, string> = {
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  gray: 'bg-slate-400',
  blue: 'bg-blue-500',
};

export function Badge({ tone, children, dot }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />}
      {children}
    </span>
  );
}
