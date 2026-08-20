export interface FlightRow {
  id: string;
  origin: string;
  destination: string;
  departure_time: Date;
  arrival_time: Date;
  flight_time_minutes: number;
  price: string;
}

export interface PackageQueryRow extends FlightRow {
  package_id: string;
  available_spots: number;
  hotel_name: string;
  hotel_nights: number;
  hotel_price: string;
  insurance_coverage_details: string;
  insurance_price: string;
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

export interface PackageDetail {
  id: string;
  availableSpots: number;
  origin: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  nights: number;
  stops: number;
  pricePerPerson: number;
  hotel: { name: string; nights: number; price: number };
  insurance: { coverageDetails: string; price: number };
  flights: PackageFlight[];
}

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
