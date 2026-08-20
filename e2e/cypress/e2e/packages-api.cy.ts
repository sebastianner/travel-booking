// End-to-end tests against the real running backend + Postgres + Redis stack
// (no mocking - these hit `docker compose up`'s backend service, or a locally
// running one, per API_URL / cypress.config.ts baseUrl).

const SOLD_OUT_PACKAGE_ID = '40000000-0000-0000-0000-000000000004';
const OVERBOOK_TARGET_PACKAGE_ID = '40000000-0000-0000-0000-000000000003';
const NONEXISTENT_ID = '00000000-0000-0000-0000-000000000000';
const NOT_A_UUID = 'not-a-uuid';

interface PackageListItem {
  id: string;
  origin: string;
  destination: string;
  departureTime: string;
  returnTime: string;
  nights: number;
  pricePerPerson: number;
  availableSpots: number;
}

interface PackageDetail extends PackageListItem {
  hotel: { name: string; nights: number; price: number };
  insurance: { coverageDetails: string; price: number };
  flights: { id: string; origin: string; destination: string; price: number }[];
}

describe('GET /packages (listing, Redis-cached)', () => {
  it('returns between 5 and 15 packages with cache metadata', () => {
    cy.request('/packages').then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('generatedAt');
      expect(res.body).to.have.property('stale');
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.within(5, 15);

      const item: PackageListItem = res.body.data[0];
      expect(item).to.include.all.keys(
        'id',
        'origin',
        'destination',
        'departureTime',
        'returnTime',
        'nights',
        'pricePerPerson',
        'availableSpots',
      );
    });
  });

  it('includes the known sold-out package with 0 availability', () => {
    cy.request('/packages').then((res) => {
      const soldOut = res.body.data.find((p: PackageListItem) => p.id === SOLD_OUT_PACKAGE_ID);
      expect(soldOut, 'sold-out seed package present in listing').to.exist;
      expect(soldOut.availableSpots).to.eq(0);
    });
  });

  it('regenerates immediately after a successful booking, without waiting out the TTL', () => {
    // Live availability, not the cached listing - a prior test's booking may have moved it.
    cy.request(`/packages/${OVERBOOK_TARGET_PACKAGE_ID}`).then((before) => {
      const beforeSpots: number = before.body.availableSpots;
      expect(beforeSpots, 'target package still has spots to book').to.be.greaterThan(0);

      cy.request('/packages').then((beforeListing) => {
        const beforeGeneratedAt = beforeListing.body.generatedAt;

        cy.request('POST', `/packages/${OVERBOOK_TARGET_PACKAGE_ID}/bookings`, { seats: 1 }).then((bookingRes) => {
          expect(bookingRes.status).to.eq(201);

          cy.request('/packages').then((afterListing) => {
            expect(afterListing.body.generatedAt).to.not.eq(beforeGeneratedAt);
            expect(afterListing.body.stale).to.eq(false);

            const pkg = afterListing.body.data.find((p: PackageListItem) => p.id === OVERBOOK_TARGET_PACKAGE_ID);
            expect(pkg.availableSpots).to.eq(beforeSpots - 1);
          });
        });
      });
    });
  });
});

describe('GET /packages/:id (detail)', () => {
  it('returns full detail whose derived price matches its components', () => {
    cy.request('/packages').then((listRes) => {
      const target: PackageListItem = listRes.body.data[0];

      cy.request(`/packages/${target.id}`).then((res) => {
        expect(res.status).to.eq(200);
        const pkg: PackageDetail = res.body;

        expect(pkg.id).to.eq(target.id);
        expect(pkg.flights.length).to.be.at.least(1);
        expect(pkg.hotel).to.have.all.keys('name', 'nights', 'price');
        expect(pkg.insurance).to.have.all.keys('coverageDetails', 'price');

        const flightTotal = pkg.flights.reduce((sum, f) => sum + f.price, 0);
        const expectedTotal = Math.round((flightTotal + pkg.hotel.price + pkg.insurance.price) * 100) / 100;
        expect(pkg.pricePerPerson).to.eq(expectedTotal);
      });
    });
  });

  it('resolves the correct destination for a connecting itinerary (not the layover hub)', () => {
    // Seed package 2: MDE -> BOG -> PUJ -> BOG -> MDE. Destination must be PUJ, not the BOG hub.
    cy.request('/packages/40000000-0000-0000-0000-000000000002').then((res) => {
      expect(res.body.origin).to.eq('MDE');
      expect(res.body.destination).to.eq('PUJ');
      expect(res.body.flights.length).to.eq(4);
    });
  });

  it('404s for a well-formed but non-existent package id', () => {
    cy.request({ url: `/packages/${NONEXISTENT_ID}`, failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(404);
    });
  });

  it('400s for a malformed id', () => {
    cy.request({ url: `/packages/${NOT_A_UUID}`, failOnStatusCode: false }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });
});

describe('POST /packages/:id/bookings', () => {
  it('creates a booking and decrements availability by exactly the booked seats', () => {
    // "before" must come from the detail endpoint (uncached, live Postgres read) - the
    // listing endpoint is intentionally cached and can lag behind real availability.
    cy.request(`/packages/${OVERBOOK_TARGET_PACKAGE_ID}`).then((beforeRes) => {
      const before: PackageDetail = beforeRes.body;
      expect(before.availableSpots, 'test package still has spots left to book').to.be.greaterThan(0);

      cy.request('POST', `/packages/${before.id}/bookings`, { seats: 1 }).then((res) => {
        expect(res.status).to.eq(201);
        expect(res.body.bookingCode).to.match(/^VY-[A-Z0-9]{6}$/);
        expect(res.body.seatsBooked).to.eq(1);
        expect(res.body.totalPrice).to.eq(before.pricePerPerson);

        cy.request(`/packages/${before.id}`).then((detailRes) => {
          expect(detailRes.body.availableSpots).to.eq(before.availableSpots - 1);
        });
      });
    });
  });

  it('rejects booking a sold-out package with a clear, structured error and no side effects', () => {
    cy.request(`/packages/${SOLD_OUT_PACKAGE_ID}`).then((beforeRes) => {
      const before = beforeRes.body.availableSpots;

      cy.request({
        method: 'POST',
        url: `/packages/${SOLD_OUT_PACKAGE_ID}/bookings`,
        body: { seats: 1 },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(409);
        expect(res.body.error).to.eq('INSUFFICIENT_AVAILABILITY');
        expect(res.body.requested).to.eq(1);
        expect(res.body.available).to.eq(0);
      });

      cy.request(`/packages/${SOLD_OUT_PACKAGE_ID}`).then((afterRes) => {
        expect(afterRes.body.availableSpots).to.eq(before);
      });
    });
  });

  it('rejects requesting more seats than currently available (requested > available)', () => {
    // Read the live count from the *detail* endpoint (uncached), not the listing (cached) -
    // a prior booking in this run may have decremented Postgres without the listing cache
    // having regenerated yet, which is the caching behavior working as intended.
    cy.request(`/packages/${OVERBOOK_TARGET_PACKAGE_ID}`).then((detailRes) => {
      const target: PackageDetail = detailRes.body;
      const overRequest = target.availableSpots + 5;

      cy.request({
        method: 'POST',
        url: `/packages/${target.id}/bookings`,
        body: { seats: overRequest },
        failOnStatusCode: false,
      }).then((res) => {
        expect(res.status).to.eq(409);
        expect(res.body.error).to.eq('INSUFFICIENT_AVAILABILITY');
        expect(res.body.requested).to.eq(overRequest);
        expect(res.body.available).to.eq(target.availableSpots);
      });

      cy.request(`/packages/${target.id}`).then((afterRes) => {
        expect(afterRes.body.availableSpots).to.eq(target.availableSpots);
      });
    });
  });

  it('rejects non-positive or missing seat counts with 400', () => {
    cy.request('/packages').then((listRes) => {
      const target: PackageListItem = listRes.body.data[0];

      [{ seats: 0 }, { seats: -3 }, {}].forEach((body) => {
        cy.request({
          method: 'POST',
          url: `/packages/${target.id}/bookings`,
          body,
          failOnStatusCode: false,
        }).then((res) => {
          expect(res.status).to.eq(400);
        });
      });
    });
  });

  it('404s when booking a non-existent package', () => {
    cy.request({
      method: 'POST',
      url: `/packages/${NONEXISTENT_ID}/bookings`,
      body: { seats: 1 },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(404);
    });
  });
});
