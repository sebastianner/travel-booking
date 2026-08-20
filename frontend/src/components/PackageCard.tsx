import Link from 'next/link';
import { AvailabilityLabel } from './AvailabilityLabel';
import { PlaneIcon } from './ui/icons';
import { formatCurrency, formatDateRange, formatStops } from '@/lib/format';

interface PackageCardProps {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  nights: number;
  stops: number;
  pricePerPerson: number;
  availableSpots: number;
}

export function PackageCard({
  id,
  origin,
  destination,
  departureTime,
  returnTime,
  nights,
  stops,
  pricePerPerson,
  availableSpots,
}: PackageCardProps) {
  const soldOut = availableSpots < 1;

  return (
    <Link
      href={`/packages/${id}`}
      className={`block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-opacity ${
        soldOut ? 'opacity-60' : 'active:opacity-80'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <span>{origin}</span>
          <PlaneIcon className="h-4 w-4 rotate-90 text-slate-400" />
          <span>{destination}</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-400">from</div>
          <div className="text-lg font-bold text-blue-600">{formatCurrency(pricePerPerson)}</div>
        </div>
      </div>

      <p className="mt-1 text-sm text-slate-500">
        {formatDateRange(departureTime, returnTime)} · {nights} night{nights === 1 ? '' : 's'} ·{' '}
        {formatStops(stops)}
      </p>

      <div className="mt-3">
        <AvailabilityLabel availableSpots={availableSpots} />
      </div>
    </Link>
  );
}
