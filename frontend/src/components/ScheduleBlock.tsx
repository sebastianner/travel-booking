import { formatDateLong, formatTime } from '@/lib/format';

interface ScheduleBlockProps {
  origin: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  nights: number;
}

export function ScheduleBlock({ origin, destination, departureTime, returnTime, nights }: ScheduleBlockProps) {
  return (
    <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Departure</div>
        <div className="mt-1 text-xl font-bold text-slate-900">{formatTime(departureTime)}</div>
        <div className="text-xs text-slate-500">{formatDateLong(departureTime)}</div>
        <div className="text-xs text-slate-400">{origin} → {destination}</div>
      </div>
      <div className="text-right">
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Return</div>
        <div className="mt-1 text-xl font-bold text-slate-900">{formatTime(returnTime)}</div>
        <div className="text-xs text-slate-500">{formatDateLong(returnTime)}</div>
        <div className="text-xs text-slate-400">{destination} → {origin}</div>
      </div>
      <div className="col-span-2 border-t border-slate-100 pt-2 text-center text-xs text-slate-500">
        {nights} night{nights === 1 ? '' : 's'} total
      </div>
    </div>
  );
}
