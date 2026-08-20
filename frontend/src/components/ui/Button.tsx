import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white active:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400',
  secondary: 'bg-white text-slate-900 border border-slate-300 active:bg-slate-50 disabled:text-slate-300',
  ghost: 'bg-transparent text-blue-600 active:text-blue-700 disabled:text-slate-300',
};

export function Button({ variant = 'primary', fullWidth, className = '', disabled, children, ...rest }: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        'rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
