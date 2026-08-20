export interface PackageListItem {
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

export interface PackageFlight {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  flightTimeMinutes: number;
  price: number;
}

export interface PackageDetail extends PackageListItem {
  hotel: { name: string; nights: number; price: number };
  insurance: { coverageDetails: string; price: number };
  flights: PackageFlight[];
}

export interface PackagesListResponse {
  data: PackageListItem[];
  generatedAt: string;
  stale: boolean;
}

export interface BookingSuccess {
  bookingId: string;
  bookingCode: string;
  packageId: string;
  seatsBooked: number;
  totalPrice: number;
  createdAt: string;
}

export type BookingError =
  | { kind: 'insufficient_availability'; message: string; requested: number; available: number }
  | { kind: 'not_found'; message: string }
  | { kind: 'validation'; message: string }
  | { kind: 'network'; message: string }
  | { kind: 'unknown'; message: string };
