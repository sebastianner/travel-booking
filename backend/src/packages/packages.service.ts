import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { Pool } from 'pg';
import type Redis from 'ioredis';
import { PG_POOL } from '../database/database.module';
import { REDIS_CLIENT } from '../redis/redis.module';
import type {
  PackageDetail,
  PackageFlight,
  PackageListItem,
  PackageQueryRow,
} from './packages.types';

const PACKAGE_QUERY = `
  SELECT
    p.id AS package_id,
    p.available_spots,
    h.name AS hotel_name,
    h.nights AS hotel_nights,
    h.price AS hotel_price,
    ti.coverage_details AS insurance_coverage_details,
    ti.price AS insurance_price,
    f.id,
    f.origin,
    f.destination,
    f.departure_time,
    f.arrival_time,
    f.flight_time_minutes,
    f.price
  FROM packages p
  JOIN hotels h ON h.id = p.hotel_id
  JOIN travel_insurance ti ON ti.id = p.insurance_id
  JOIN package_flights pf ON pf.package_id = p.id
  JOIN flight_details f ON f.id = pf.flight_id
  {WHERE}
  ORDER BY p.id, f.departure_time;
`;

const LISTING_QUERY = PACKAGE_QUERY.replace('{WHERE}', '');
const DETAIL_QUERY = PACKAGE_QUERY.replace('{WHERE}', 'WHERE p.id = $1');

const BOOKING_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous 0/O, 1/I

function generateBookingCode(): string {
  const bytes = randomBytes(6);
  let code = '';
  for (let i = 0; i < bytes.length; i++) {
    code += BOOKING_CODE_CHARS[bytes[i] % BOOKING_CODE_CHARS.length];
  }
  return `VY-${code}`;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class PackagesService {
  private readonly logger = new Logger(PackagesService.name);
  private readonly CACHE_KEY = 'packages:listing';
  private readonly LOCK_KEY = 'packages:listing:lock';

  constructor(
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService,
  ) {}

  private aggregatePackages(rows: PackageQueryRow[]): PackageDetail[] {
    const byPackage = new Map<string, PackageQueryRow[]>();
    for (const row of rows) {
      const list = byPackage.get(row.package_id) ?? [];
      list.push(row);
      byPackage.set(row.package_id, list);
    }

    const packages: PackageDetail[] = [];
    for (const [packageId, legs] of byPackage) {
      // legs are pre-sorted by departure_time (SQL ORDER BY). The "destination" leg is the
      // one right before the longest gap between an arrival and the next departure — that
      // gap is the multi-day stay, as opposed to a short connection layover.
      let destinationLegIndex = 0;
      let maxGapMs = -Infinity;
      for (let i = 0; i < legs.length - 1; i++) {
        const gap =
          legs[i + 1].departure_time.getTime() - legs[i].arrival_time.getTime();
        if (gap > maxGapMs) {
          maxGapMs = gap;
          destinationLegIndex = i;
        }
      }

      const first = legs[0];
      const last = legs[legs.length - 1];
      const destinationLeg = legs[destinationLegIndex];

      const flightTotal = legs.reduce((sum, leg) => sum + Number(leg.price), 0);
      const hotelPrice = Number(first.hotel_price);
      const insurancePrice = Number(first.insurance_price);

      const flights: PackageFlight[] = legs.map((leg) => ({
        id: leg.id,
        origin: leg.origin,
        destination: leg.destination,
        departureTime: leg.departure_time.toISOString(),
        arrivalTime: leg.arrival_time.toISOString(),
        flightTimeMinutes: leg.flight_time_minutes,
        price: Number(leg.price),
      }));

      // Round trips have an even number of legs (N one-way, N return); stops per leg = N - 1.
      const stops = Math.max(0, Math.floor(legs.length / 2) - 1);

      packages.push({
        id: packageId,
        availableSpots: first.available_spots,
        origin: first.origin,
        destination: destinationLeg.destination,
        departureTime: first.departure_time.toISOString(),
        returnTime: last.arrival_time.toISOString(),
        nights: first.hotel_nights,
        stops,
        pricePerPerson: round2(flightTotal + hotelPrice + insurancePrice),
        hotel: {
          name: first.hotel_name,
          nights: first.hotel_nights,
          price: hotelPrice,
        },
        insurance: {
          coverageDetails: first.insurance_coverage_details,
          price: insurancePrice,
        },
        flights,
      });
    }
    return packages;
  }

  private toListItem(pkg: PackageDetail): PackageListItem {
    const {
      id,
      origin,
      destination,
      departureTime,
      returnTime,
      nights,
      stops,
      pricePerPerson,
      availableSpots,
    } = pkg;
    return {
      id,
      origin,
      destination,
      departureTime,
      returnTime,
      nights,
      stops,
      pricePerPerson,
      availableSpots,
    };
  }

  private async buildAndCacheListing(): Promise<{
    data: PackageListItem[];
    generatedAt: string;
  }> {
    const result = await this.pool.query<PackageQueryRow>(LISTING_QUERY);
    const data = this.aggregatePackages(result.rows).map((pkg) =>
      this.toListItem(pkg),
    );
    const payload = { data, generatedAt: new Date().toISOString() };
    await this.redis.set(this.CACHE_KEY, JSON.stringify(payload));
    return payload;
  }

  private regenerateListingInBackground(): void {
    this.redis
      .set(this.LOCK_KEY, '1', 'EX', 30, 'NX')
      .then((acquired) => {
        if (acquired !== 'OK') return;
        return this.buildAndCacheListing()
          .catch((err) =>
            this.logger.error('listing cache regeneration failed', err),
          )
          .finally(() => {
            this.redis.del(this.LOCK_KEY).catch(() => undefined);
          });
      })
      .catch((err) => this.logger.error('listing cache lock failed', err));
  }

  async findAll(): Promise<{
    data: PackageListItem[];
    generatedAt: string;
    stale: boolean;
  }> {
    const ttlMs =
      Number(this.config.get('REDIS_CACHE_TTL_SECONDS', 900)) * 1000;
    const cached = await this.redis.get(this.CACHE_KEY);

    if (!cached) {
      const fresh = await this.buildAndCacheListing();
      return { ...fresh, stale: false };
    }

    const parsed = JSON.parse(cached) as {
      data: PackageListItem[];
      generatedAt: string;
    };
    const age = Date.now() - new Date(parsed.generatedAt).getTime();
    const stale = age >= ttlMs;

    if (stale) {
      // Serve the stale payload now; regenerate in the background for the *next* request.
      this.regenerateListingInBackground();
    }

    return { ...parsed, stale };
  }

  async findOne(id: string): Promise<PackageDetail> {
    const result = await this.pool.query<PackageQueryRow>(DETAIL_QUERY, [id]);
    if (result.rowCount === 0) {
      throw new NotFoundException('Package not found');
    }
    return this.aggregatePackages(result.rows)[0];
  }

  async createBooking(packageId: string, seats: number) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query<{ available_spots: number }>(
        'SELECT available_spots FROM packages WHERE id = $1 FOR UPDATE',
        [packageId],
      );

      if (rows.length === 0) {
        throw new NotFoundException('Package not found');
      }

      const available = rows[0].available_spots;
      if (available < seats) {
        throw new ConflictException({
          error: 'INSUFFICIENT_AVAILABILITY',
          message: `Only ${available} spot(s) left, ${seats} requested.`,
          requested: seats,
          available,
        });
      }

      await client.query(
        'UPDATE packages SET available_spots = available_spots - $1 WHERE id = $2',
        [seats, packageId],
      );

      const priceRows = await client.query<PackageQueryRow>(DETAIL_QUERY, [
        packageId,
      ]);
      const [pkg] = this.aggregatePackages(priceRows.rows);
      const totalPrice = round2(pkg.pricePerPerson * seats);
      const bookingCode = generateBookingCode();

      const { rows: bookingRows } = await client.query<{
        id: string;
        created_at: Date;
      }>(
        `INSERT INTO bookings (package_id, seats_booked, booking_code)
         VALUES ($1, $2, $3)
         RETURNING id, created_at`,
        [packageId, seats, bookingCode],
      );

      await client.query('COMMIT');

      // Availability just changed for real - don't make the listing wait out the rest of
      // its TTL to reflect that. Same non-blocking, lock-deduped path as the stale-cache case.
      this.regenerateListingInBackground();

      return {
        bookingId: bookingRows[0].id,
        bookingCode,
        packageId,
        seatsBooked: seats,
        totalPrice,
        createdAt: bookingRows[0].created_at.toISOString(),
      };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw err;
    } finally {
      client.release();
    }
  }
}
