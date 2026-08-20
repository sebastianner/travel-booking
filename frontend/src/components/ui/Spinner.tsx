interface SpinnerProps {
  className?: string;
}

export function Spinner({ className = 'h-6 w-6' }: SpinnerProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={`animate-spin text-blue-600 ${className}`} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
