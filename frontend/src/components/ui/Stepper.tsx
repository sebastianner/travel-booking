interface StepperProps {
  value: number;
  min: number;
  max: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  label?: string;
}

export function Stepper({ value, min, max, onChange, disabled, label }: StepperProps) {
  const canDecrement = !disabled && value > min;
  const canIncrement = !disabled && value < max;

  return (
    <div className="flex items-center justify-between gap-4">
      {label && <span className="text-sm text-slate-600">{label}</span>}
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Decrease"
          disabled={!canDecrement}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-lg font-medium text-slate-700 disabled:border-slate-200 disabled:text-slate-300"
        >
          −
        </button>
        <span className="w-6 text-center text-base font-semibold text-slate-900">{value}</span>
        <button
          type="button"
          aria-label="Increase"
          disabled={!canIncrement}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-lg font-medium text-slate-700 disabled:border-slate-200 disabled:text-slate-300"
        >
          +
        </button>
      </div>
    </div>
  );
}
