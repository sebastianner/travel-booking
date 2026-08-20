'use client';

import { useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePackageDetail } from '@/lib/hooks';
import { useBookingStore } from '@/store/bookingStore';
import { formatCurrency, formatStops } from '@/lib/format';
import { AvailabilityLabel } from '@/components/AvailabilityLabel';
import { ScheduleBlock } from '@/components/ScheduleBlock';
import { IncludesList, type IncludeItem } from '@/components/IncludesList';
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/Button';
import { Stepper } from '@/components/ui/Stepper';
import { Spinner } from '@/components/ui/Spinner';
import { PageShell } from '@/components/ui/PageShell';
import { BackArrowIcon, CompassIcon, HotelIcon, PlaneIcon, ShieldIcon } from '@/components/ui/icons';

export default function PackageDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { packageDetail, notFound, isLoading, error, refresh } = usePackageDetail(params.id);
  const startBooking = useBookingStore((s) => s.startBooking);
  const submitBooking = useBookingStore((s) => s.submitBooking);
  const [guests, setGuests] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  // Belt-and-suspenders against a double-click firing two submissions before the
  // `disabled` state has committed - the DOM attribute alone isn't synchronous enough.
  const submittingRef = useRef(false);

  if (isLoading) {
    return (
      <PageShell width="narrow" center>
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      </PageShell>
    );
  }

  if (error || notFound) {
    return (
      <PageShell width="medium" className="pt-6">
        <EmptyState
          icon={<CompassIcon />}
          title={notFound ? 'Package not found' : "Couldn't load this package"}
          message={
            notFound
              ? "This package doesn't exist or is no longer offered."
              : 'Something went wrong reaching the server. Please try again.'
          }
          primaryAction={notFound ? { label: 'Back to packages', onClick: () => router.push('/') } : { label: 'Retry', onClick: () => refresh() }}
        />
      </PageShell>
    );
  }

  if (!packageDetail) return null;

  const soldOut = packageDetail.availableSpots < 1;
  const atMax = guests === packageDetail.availableSpots && !soldOut;

  const includeItems: IncludeItem[] = [
    {
      icon: <PlaneIcon className="h-4 w-4" />,
      label: formatStops(packageDetail.stops) === 'Direct' ? 'Direct flight' : 'Flights',
      subtitle: `${formatStops(packageDetail.stops)} · ${packageDetail.flights.length} leg${packageDetail.flights.length === 1 ? '' : 's'}`,
      price: packageDetail.flights.reduce((sum, f) => sum + f.price, 0),
    },
    {
      icon: <HotelIcon />,
      label: `Hotel · ${packageDetail.hotel.nights} nights`,
      subtitle: packageDetail.hotel.name,
      price: packageDetail.hotel.price,
    },
    {
      icon: <ShieldIcon />,
      label: 'Travel insurance',
      subtitle: packageDetail.insurance.coverageDetails,
      price: packageDetail.insurance.price,
    },
  ];

  const packageTotal = packageDetail.pricePerPerson * guests;

  const handleBook = async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsBooking(true);

    startBooking(packageDetail.id, guests);
    await submitBooking();

    router.push(`/packages/${packageDetail.id}/booking`);
  };

  return (
    <PageShell width="medium" className="pb-28 pt-6 md:pb-10">
      <header className="flex items-center gap-3">
        <button
          onClick={() => router.push('/')}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
        >
          <BackArrowIcon />
        </button>
        <h1 className="text-lg font-semibold text-slate-900 md:text-xl">
          {packageDetail.origin} → {packageDetail.destination}
        </h1>
      </header>

      <div className="mt-4 md:grid md:grid-cols-3 md:items-start md:gap-6">
        <div className="flex flex-col gap-4 md:col-span-2">
          <ScheduleBlock
            origin={packageDetail.origin}
            destination={packageDetail.destination}
            departureTime={packageDetail.departureTime}
            returnTime={packageDetail.returnTime}
            nights={packageDetail.nights}
          />

          <IncludesList items={includeItems} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <AvailabilityLabel availableSpots={packageDetail.availableSpots} />
              <div className="text-right">
                <div className="text-xs text-slate-400">Price per person</div>
                <div className="text-base font-bold text-slate-900">{formatCurrency(packageDetail.pricePerPerson)}</div>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              We verify actual availability at the time of booking, not from cached data.
            </p>
          </div>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-slate-200 bg-white px-4 py-4 md:sticky md:top-6 md:z-auto md:mx-0 md:inset-x-auto md:bottom-auto md:max-w-none md:rounded-2xl md:border md:shadow-sm">
          {soldOut ? (
            <p className="mb-3 text-center text-sm font-medium text-red-600">
              This package is sold out. Check back later or browse other packages.
            </p>
          ) : (
            <div className="mb-3">
              <Stepper
                label="Guests"
                value={guests}
                min={1}
                max={packageDetail.availableSpots}
                onChange={setGuests}
              />
              {atMax && (
                <p className="mt-2 text-xs text-amber-600">
                  Only {packageDetail.availableSpots} spot{packageDetail.availableSpots === 1 ? '' : 's'} left in
                  this package. That&apos;s the most you can book.
                </p>
              )}
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            disabled={soldOut || isBooking}
            onClick={handleBook}
            data-testid="book-button"
          >
            {soldOut ? 'Sold out' : isBooking ? 'Confirming…' : `Book · ${formatCurrency(packageTotal)}`}
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
