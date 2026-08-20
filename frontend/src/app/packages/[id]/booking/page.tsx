'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useBookingStore } from '@/store/bookingStore';
import { usePackageDetail } from '@/lib/hooks';
import { formatCurrency, formatDateRange } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { StatGrid } from '@/components/StatGrid';
import { PageShell } from '@/components/ui/PageShell';
import { CheckCircleIcon, WarningIcon } from '@/components/ui/icons';

export default function BookingMakerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const packageId = useBookingStore((s) => s.packageId);
  const status = useBookingStore((s) => s.status);
  const result = useBookingStore((s) => s.result);
  const error = useBookingStore((s) => s.error);
  const submitBooking = useBookingStore((s) => s.submitBooking);

  const { packageDetail } = usePackageDetail(params.id);

  useEffect(() => {
    if (packageId !== params.id) {
      // No booking in progress for this package (direct link, refresh, back button) -
      // there's nothing to submit, send the user back to pick seats again.
      router.replace(`/packages/${params.id}`);
      return;
    }
    if (status === 'idle') {
      void submitBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packageId, params.id]);

  if (packageId !== params.id || status === 'idle' || status === 'loading') {
    return (
      <PageShell width="narrow" center>
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Spinner className="h-8 w-8" />
          <p className="text-sm text-slate-500">Confirming your booking…</p>
        </div>
      </PageShell>
    );
  }

  if (status === 'success' && result) {
    const handleDownloadReceipt = () => {
      const receipt = [
        'Booking receipt',
        `Booking code: ${result.bookingCode}`,
        packageDetail ? `Route: ${packageDetail.origin} -> ${packageDetail.destination}` : null,
        packageDetail ? `Dates: ${formatDateRange(packageDetail.departureTime, packageDetail.returnTime)}` : null,
        `Guests: ${result.seatsBooked}`,
        `Total paid: ${formatCurrency(result.totalPrice)}`,
        `Booked at: ${new Date(result.createdAt).toLocaleString()}`,
      ]
        .filter(Boolean)
        .join('\n');

      const blob = new Blob([receipt], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${result.bookingCode}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <PageShell width="narrow" center>
        <div
          data-testid="success-screen"
          className="flex w-full flex-col items-center gap-6 py-10 text-center"
        >
          <CheckCircleIcon className="h-16 w-16 text-emerald-500" />
        <div>
          <h1 className="text-xl font-bold text-slate-900">Booking confirmed!</h1>
          <p className="mt-1 text-sm text-slate-500">Your spots have been secured.</p>
        </div>

        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left">
          {packageDetail && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                {packageDetail.origin} → {packageDetail.destination}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Confirmed
              </span>
            </div>
          )}
          <div className="mt-3 flex flex-col gap-2 text-sm">
            {packageDetail && (
              <div className="flex justify-between text-slate-500">
                <span>Dates</span>
                <span className="text-slate-900">{formatDateRange(packageDetail.departureTime, packageDetail.returnTime)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Guests</span>
              <span className="text-slate-900">{result.seatsBooked} passenger{result.seatsBooked === 1 ? '' : 's'}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Booking code</span>
              <span className="font-mono font-semibold text-blue-600" data-testid="booking-code">
                {result.bookingCode}
              </span>
            </div>
            <div className="mt-1 flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-slate-900">
              <span>Total paid</span>
              <span data-testid="total-paid">{formatCurrency(result.totalPrice)}</span>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button variant="primary" fullWidth onClick={() => router.push('/')}>
            Back to home
          </Button>
          <button onClick={handleDownloadReceipt} className="text-sm font-medium text-blue-600">
            Download receipt
          </button>
        </div>
        </div>
      </PageShell>
    );
  }

  // status === 'error'
  const isAvailabilityError = error?.kind === 'insufficient_availability';

  return (
    <PageShell width="narrow" center>
      <div data-testid="error-screen" className="flex w-full flex-col items-center gap-6 py-10 text-center">
      <WarningIcon className="h-16 w-16 text-amber-500" />
      <div>
        <h1 className="text-xl font-bold text-slate-900">We couldn&apos;t complete your booking</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isAvailabilityError
            ? 'There are no longer enough spots available for the number of guests selected. Please adjust the number of passengers and try again.'
            : error?.message ?? 'Something went wrong. Please try again.'}
        </p>
      </div>

      {isAvailabilityError && error.kind === 'insufficient_availability' && (
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left">
          {packageDetail && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                {packageDetail.origin} → {packageDetail.destination}
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                Unconfirmed
              </span>
            </div>
          )}
          <StatGrid
            stats={[
              { label: 'Requested', value: `${error.requested} passenger${error.requested === 1 ? '' : 's'}` },
              { label: 'Available now', value: `${error.available} actual spot${error.available === 1 ? '' : 's'}`, emphasis: 'warning' },
            ]}
          />
          <p className="mt-3 text-xs text-slate-400">No charges were made. Availability changed while you were completing the booking.</p>
        </div>
      )}

      <div className="flex w-full flex-col gap-3">
        <Button variant="primary" fullWidth onClick={() => router.push(`/packages/${params.id}`)}>
          Back to package details
        </Button>
        <button onClick={() => router.push('/')} className="text-sm font-medium text-blue-600">
          View other packages
        </button>
      </div>
      </div>
    </PageShell>
  );
}
