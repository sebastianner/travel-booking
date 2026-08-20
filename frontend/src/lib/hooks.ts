import useSWR from 'swr';
import { fetchPackageDetail, fetchPackages } from './api';

export function usePackagesList() {
  const { data, error, isLoading, mutate } = useSWR('packages', fetchPackages, {
    revalidateOnFocus: false,
  });

  return {
    packages: data?.data,
    generatedAt: data?.generatedAt,
    stale: data?.stale ?? false,
    isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  };
}

export function usePackageDetail(id: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? ['package', id] : null,
    () => fetchPackageDetail(id as string),
    { revalidateOnFocus: false },
  );

  return {
    // `data === null` means the API returned 404 (package not found).
    packageDetail: data,
    notFound: data === null,
    isLoading,
    error: error as Error | undefined,
    refresh: mutate,
  };
}
