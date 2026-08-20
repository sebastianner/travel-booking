import type { BookingError, BookingSuccess, PackageDetail, PackagesListResponse } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function fetchPackages(): Promise<PackagesListResponse> {
  const res = await fetch(`${API_URL}/packages`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Failed to load packages (${res.status})`);
  }
  return res.json();
}

export async function fetchPackageDetail(id: string): Promise<PackageDetail | null> {
  const res = await fetch(`${API_URL}/packages/${id}`, { cache: 'no-store' });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Failed to load package (${res.status})`);
  }
  return res.json();
}

export type BookingResult = { ok: true; data: BookingSuccess } | { ok: false; error: BookingError };

export async function createBooking(packageId: string, seats: number): Promise<BookingResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/packages/${packageId}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seats }),
    });
  } catch {
    return { ok: false, error: { kind: 'network', message: 'Could not reach the server. Check your connection and try again.' } };
  }

  const body = await res.json().catch(() => null);

  if (res.ok) {
    return { ok: true, data: body as BookingSuccess };
  }

  if (res.status === 409 && body?.error === 'INSUFFICIENT_AVAILABILITY') {
    return {
      ok: false,
      error: {
        kind: 'insufficient_availability',
        message: body.message ?? 'Not enough spots available.',
        requested: body.requested,
        available: body.available,
      },
    };
  }

  if (res.status === 404) {
    return { ok: false, error: { kind: 'not_found', message: 'This package no longer exists.' } };
  }

  if (res.status === 400) {
    return { ok: false, error: { kind: 'validation', message: body?.message?.[0] ?? body?.message ?? 'Invalid booking request.' } };
  }

  return { ok: false, error: { kind: 'unknown', message: 'Something went wrong while confirming your booking.' } };
}
