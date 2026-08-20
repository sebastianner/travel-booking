import { create } from 'zustand';
import { createBooking } from '@/lib/api';
import type { BookingError, BookingSuccess } from '@/lib/types';

type BookingStatus = 'idle' | 'loading' | 'success' | 'error';

interface BookingState {
  packageId: string | null;
  seats: number;
  status: BookingStatus;
  result: BookingSuccess | null;
  error: BookingError | null;
  startBooking: (packageId: string, seats: number) => void;
  submitBooking: () => Promise<void>;
  reset: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  packageId: null,
  seats: 1,
  status: 'idle',
  result: null,
  error: null,

  startBooking: (packageId, seats) => {
    set({ packageId, seats, status: 'idle', result: null, error: null });
  },

  submitBooking: async () => {
    const { packageId, seats } = get();
    if (!packageId) return;

    set({ status: 'loading' });
    const outcome = await createBooking(packageId, seats);

    if (outcome.ok) {
      set({ status: 'success', result: outcome.data, error: null });
    } else {
      set({ status: 'error', error: outcome.error, result: null });
    }
  },

  reset: () => set({ packageId: null, seats: 1, status: 'idle', result: null, error: null }),
}));
