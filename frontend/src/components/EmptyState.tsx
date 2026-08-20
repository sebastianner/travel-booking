import type { ReactNode } from 'react';
import { Button } from './ui/Button';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}

export function EmptyState({ icon, title, message, primaryAction, secondaryAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-slate-200 px-6 py-12 text-center">
      {icon && <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">{icon}</div>}
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{message}</p>
      </div>
      {primaryAction && (
        <Button variant="primary" onClick={primaryAction.onClick}>
          {primaryAction.label}
        </Button>
      )}
      {secondaryAction && (
        <button onClick={secondaryAction.onClick} className="text-sm font-medium text-blue-600">
          {secondaryAction.label}
        </button>
      )}
    </div>
  );
}
