'use client';

import { useMemo, useState } from 'react';
import { usePackagesList } from '@/lib/hooks';
import { formatRelativeTime } from '@/lib/format';
import { PackageCard } from '@/components/PackageCard';
import { PackageListSkeleton } from '@/components/PackageCardSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { PageShell } from '@/components/ui/PageShell';
import { CompassIcon } from '@/components/ui/icons';

export default function HomePage() {
  const { packages, generatedAt, stale, isLoading, error, refresh } = usePackagesList();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!packages) return packages;
    const q = query.trim().toLowerCase();
    if (!q) return packages;
    return packages.filter(
      (pkg) => pkg.origin.toLowerCase().includes(q) || pkg.destination.toLowerCase().includes(q),
    );
  }, [packages, query]);

  return (
    <PageShell width="wide" className="pb-10 pt-6">
      <header className="md:flex md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Travel packages</h1>
          {generatedAt && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
              <span className={`h-1.5 w-1.5 rounded-full ${stale ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              Updated {formatRelativeTime(generatedAt)}
            </p>
          )}
        </div>
        <div className="mt-4 md:mt-0 md:w-72">
          <SearchInput value={query} onChange={setQuery} placeholder="Search by city or airport code" />
        </div>
      </header>

      <div className="mt-4 md:mt-8">
        {isLoading && <PackageListSkeleton count={6} />}

        {!isLoading && error && (
          <EmptyState
            icon={<CompassIcon />}
            title="Couldn't load packages"
            message="Something went wrong reaching the server. Please try again."
            primaryAction={{ label: 'Retry', onClick: () => refresh() }}
          />
        )}

        {!isLoading && !error && filtered && filtered.length === 0 && (
          <EmptyState
            icon={<CompassIcon />}
            title="No packages available"
            message="We couldn't find packages for this search. Availability updates every 15 minutes."
            primaryAction={{ label: 'Refresh availability', onClick: () => refresh() }}
            secondaryAction={query ? { label: 'Clear search', onClick: () => setQuery('') } : undefined}
          />
        )}

        {!isLoading && !error && filtered && filtered.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {filtered.map((pkg) => (
              <PackageCard key={pkg.id} {...pkg} />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
