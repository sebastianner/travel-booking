export function PackageCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-4 w-32 rounded bg-slate-200" />
        <div className="h-5 w-14 rounded bg-slate-200" />
      </div>
      <div className="mt-3 h-3 w-40 rounded bg-slate-200" />
      <div className="mt-4 h-5 w-28 rounded-full bg-slate-200" />
    </div>
  );
}

interface PackageListSkeletonProps {
  count?: number;
}

export function PackageListSkeleton({ count = 4 }: PackageListSkeletonProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <PackageCardSkeleton key={i} />
      ))}
    </div>
  );
}
