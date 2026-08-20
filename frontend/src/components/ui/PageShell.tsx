import type { ReactNode } from 'react';

type ShellWidth = 'narrow' | 'medium' | 'wide';

interface PageShellProps {
  children: ReactNode;
  width?: ShellWidth;
  center?: boolean;
  className?: string;
}

const WIDTH_CLASSES: Record<ShellWidth, string> = {
  narrow: 'max-w-md sm:max-w-lg',
  medium: 'max-w-md md:max-w-4xl',
  wide: 'max-w-md md:max-w-3xl lg:max-w-6xl',
};

export function PageShell({ children, width = 'medium', center = false, className = '' }: PageShellProps) {
  return (
    <div data-testid="page-shell" className={`min-h-dvh w-full bg-slate-50 ${center ? 'flex items-center justify-center' : ''}`}>
      <main className={`mx-auto w-full ${WIDTH_CLASSES[width]} px-4 ${className}`}>{children}</main>
    </div>
  );
}
