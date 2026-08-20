// Real-browser UI e2e tests, driven against the actual Next.js dev server + live
// backend/Postgres/Redis (no mocking). Package targets are resolved dynamically via
// direct API calls rather than hardcoded ids, since booking tests mutate real DB state.
//
// Important: the listing endpoint (GET /packages) is Redis-cached by design, so its
// availableSpots can lag behind reality once another test has booked seats. Any
// assertion that depends on an *exact* seat count re-reads the detail endpoint
// (GET /packages/:id, always live) right before using the number.

const API_URL = 'http://localhost:3001';

interface PackageListItem {
  id: string;
  availableSpots: number;
}

interface PackageDetail extends PackageListItem {
  origin: string;
  destination: string;
}

function livePackages(): Cypress.Chainable<PackageListItem[]> {
  return cy.request(`${API_URL}/packages`).then((res) => res.body.data as PackageListItem[]);
}

function liveDetail(id: string): Cypress.Chainable<PackageDetail> {
  return cy.request(`${API_URL}/packages/${id}`).then((res) => res.body as PackageDetail);
}

describe('Responsive layout', () => {
  // Compare against document.documentElement.clientWidth, not the raw configured viewport -
  // a vertical scrollbar (present once page content exceeds viewport height) shaves a few
  // pixels off the content box, which is expected browser behavior, not a layout bug.
  function assertFullBleed() {
    cy.document().then((doc) => {
      const clientWidth = doc.documentElement.clientWidth;
      cy.get('[data-testid="page-shell"]').invoke('outerWidth').should('eq', clientWidth);
    });
  }

  [375, 1440].forEach((width) => {
    it(`home page background spans the full viewport width at ${width}px`, () => {
      cy.viewport(width, 900);
      cy.visit('/');
      assertFullBleed();
    });

    it(`detail page background spans the full viewport width at ${width}px`, () => {
      cy.viewport(width, 900);
      livePackages().then((packages) => {
        cy.visit(`/packages/${packages[0].id}`);
        assertFullBleed();
      });
    });
  });
});

describe('Home page (package listing)', () => {
  it('shows the packages with route, price and an availability label', () => {
    cy.visit('/');
    cy.contains('h1', 'Travel packages').should('be.visible');
    cy.contains('a[href^="/packages/"]', '$').should('be.visible');
    cy.get('a[href^="/packages/"]')
      .first()
      .invoke('text')
      .should('match', /(spots? available|Unavailable|Last \d+ spot)/);
  });

  it('shows "Unavailable" on a sold-out package card', () => {
    livePackages().then((packages) => {
      const soldOut = packages.find((p) => p.availableSpots < 1);
      if (!soldOut) {
        cy.log('no sold-out package currently seeded, skipping');
        return;
      }
      cy.visit('/');
      cy.get(`a[href="/packages/${soldOut.id}"]`).should('contain.text', 'Unavailable');
    });
  });
});

describe('Package detail page', () => {
  it('renders schedule, included items, price and a guest stepper', () => {
    livePackages().then((packages) => {
      const candidateId = packages.find((p) => p.availableSpots > 0)!.id;

      liveDetail(candidateId).then((live) => {
        cy.visit(`/packages/${candidateId}`);

        cy.contains('h1', '→').should('be.visible');
        cy.contains('Departure').should('be.visible');
        cy.contains('Return').should('be.visible');
        cy.contains('Package includes').should('be.visible');
        cy.contains('3 items').should('be.visible');
        cy.contains('Travel insurance').should('be.visible');
        cy.contains('Price per person').should('be.visible');

        if (live.availableSpots > 0) {
          cy.get('[data-testid="book-button"]').should('be.visible').and('not.be.disabled');
        }
      });
    });
  });

  it('guest stepper cannot go below 1 or above live availability', () => {
    livePackages().then((packages) => {
      // A low-availability package makes the upper bound quick to reach.
      const candidateId = packages
        .filter((p) => p.availableSpots > 0)
        .sort((a, b) => a.availableSpots - b.availableSpots)[0].id;

      liveDetail(candidateId).then((live) => {
        cy.visit(`/packages/${candidateId}`);

        cy.get('[aria-label="Decrease"]').should('be.disabled');

        for (let i = 1; i < live.availableSpots; i++) {
          cy.get('[aria-label="Increase"]').click();
        }

        cy.get('[aria-label="Increase"]').should('be.disabled');
        cy.contains(`${live.availableSpots} spot`).should('be.visible');

        cy.get('[aria-label="Decrease"]').click();
        cy.get('[aria-label="Increase"]').should('not.be.disabled');
      });
    });
  });

  it('sold-out package disables booking and hides the guest selector', () => {
    livePackages().then((packages) => {
      const soldOut = packages.find((p) => p.availableSpots < 1);
      if (!soldOut) {
        cy.log('no sold-out package currently seeded, skipping');
        return;
      }
      cy.visit(`/packages/${soldOut.id}`);
      cy.contains('sold out').should('be.visible');
      cy.get('[data-testid="book-button"]').should('be.disabled').and('contain.text', 'Sold out');
      cy.get('[aria-label="Increase"]').should('not.exist');
    });
  });
});

describe('Booking flow: success', () => {
  it('books seats end to end and shows the confirmation screen', () => {
    livePackages().then((packages) => {
      const candidateId = packages
        .filter((p) => p.availableSpots >= 2)
        .sort((a, b) => b.availableSpots - a.availableSpots)[0].id;

      liveDetail(candidateId).then((live) => {
        expect(live.availableSpots, 'candidate still has 2+ live spots').to.be.at.least(2);

        cy.visit(`/packages/${candidateId}`);

        cy.get('[aria-label="Increase"]').click(); // 2 guests
        cy.get('[data-testid="book-button"]').click();

        cy.url().should('include', `/packages/${candidateId}/booking`);
        cy.get('[data-testid="success-screen"]', { timeout: 10000 }).should('be.visible');
        cy.contains('Booking confirmed!').should('be.visible');
        cy.get('[data-testid="booking-code"]').invoke('text').should('match', /^VY-[A-Z0-9]{6}$/);
        cy.get('[data-testid="total-paid"]').should('contain.text', '$');
        cy.contains('2 passengers').should('be.visible');

        cy.contains('button', 'Back to home').click();
        cy.url().should('eq', Cypress.config().baseUrl + '/');
      });
    });
  });
});

describe('Booking flow: overbooking error', () => {
  it('shows requested vs. available when availability changes before booking is confirmed', () => {
    livePackages().then((packages) => {
      const candidateId = packages
        .filter((p) => p.availableSpots >= 2)
        .sort((a, b) => b.availableSpots - a.availableSpots)[0].id;

      liveDetail(candidateId).then((live) => {
        const originalAvailable = live.availableSpots;
        expect(originalAvailable, 'candidate still has 2+ live spots').to.be.at.least(2);

        cy.visit(`/packages/${candidateId}`);

        // Select every available seat through the real stepper UI.
        for (let i = 1; i < originalAvailable; i++) {
          cy.get('[aria-label="Increase"]').click();
        }
        cy.get('[aria-label="Increase"]').should('be.disabled');

        // Simulate another customer booking 1 seat in the background, between this
        // browser loading the page and clicking "Book" - a genuine race, not a mock.
        cy.request('POST', `${API_URL}/packages/${candidateId}/bookings`, { seats: 1 }).then((res) => {
          expect(res.status).to.eq(201);
        });

        cy.get('[data-testid="book-button"]').click();

        cy.get('[data-testid="error-screen"]', { timeout: 10000 }).should('be.visible');
        cy.contains("We couldn't complete your booking").should('be.visible');
        cy.contains(`${originalAvailable} passenger`).should('be.visible');
        cy.contains(`${originalAvailable - 1} actual spot`).should('be.visible');
        cy.contains('No charges were made').should('be.visible');

        cy.contains('button', 'Back to package details').click();
        cy.url().should('include', `/packages/${candidateId}`);
        cy.url().should('not.include', '/booking');
      });
    });
  });
});
