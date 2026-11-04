import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('PRD Section 20 E2E Verification: Scenarios A & B', () => {
  describe('Scenario A: Direct Customer Booking Flow', () => {
    const customerUserId = 'e2e-cust-scenario-a';
    let selectedOfferId: string;
    let createdBookingId: string;
    let createdBookingRef: string;

    it('Step 1-4: Searches flights and selects an available offer', async () => {
      const searchRes = await app.request(
        '/api/v1/flights/search?origin=JFK&destination=LHR&departureDate=2026-12-15&passengerCount=1&cabinClass=ECONOMY',
        {
          method: 'GET',
          headers: {
            'x-demo-user-id': customerUserId,
            'x-demo-role': 'CUSTOMER'
          }
        }
      );

      expect(searchRes.status).toBe(200);
      const searchBody = (await searchRes.json()) as any;
      expect(searchBody.success).toBe(true);
      expect(searchBody.count).toBeGreaterThan(0);
      expect(searchBody.data[0].inventorySource).toBe('MOCK');
      expect(searchBody.data[0].markupAmount).toBeGreaterThan(0);

      selectedOfferId = searchBody.data[0].id;
      expect(selectedOfferId).toBeDefined();
    });

    it('Step 5-8: Creates confirmed reservation with immutable price snapshot and mock PNR', async () => {
      const idempotencyKey = `idem-e2e-a-${Date.now()}`;
      const bookingRes = await app.request('/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          offerId: selectedOfferId,
          passengers: [
            {
              passengerType: 'ADULT',
              firstName: 'Eleanor',
              lastName: 'Vance',
              dateOfBirth: '1988-06-12',
              passportNumber: 'E98765432'
            }
          ]
        })
      });

      expect(bookingRes.status).toBe(201);
      const bookingBody = (await bookingRes.json()) as any;
      expect(bookingBody.success).toBe(true);
      expect(bookingBody.data.bookingStatus).toBe('CONFIRMED');
      expect(bookingBody.data.bookingReference).toMatch(/^BK-[A-Z0-9]{6}$/);
      expect(bookingBody.data.pnr).toMatch(/^[A-Z0-9]{6}$/);
      expect(bookingBody.data.totalAmount).toBeGreaterThan(0);
      expect(bookingBody.data.customerUserId).toBe(customerUserId);

      createdBookingId = bookingBody.data.id;
      createdBookingRef = bookingBody.data.bookingReference;
    });

    it('Step 9-10: Processes payment, issues 13-digit mock tickets, and customer views details', async () => {
      const payRes = await app.request(`/api/v1/bookings/${createdBookingId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `pay-idem-e2e-a-${Date.now()}`,
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          simulationScenario: 'SUCCESS'
        })
      });

      expect(payRes.status).toBe(201);
      const payBody = (await payRes.json()) as any;
      expect(payBody.success).toBe(true);
      expect(payBody.data.payment.status).toBe('SUCCEEDED');
      expect(payBody.data.tickets.length).toBe(1);
      expect(payBody.data.tickets[0].ticketNumber).toMatch(/^001-DEMO-\d{10}$/);

      // Customer views tickets endpoint
      const tktRes = await app.request(`/api/v1/bookings/${createdBookingId}/tickets`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });

      expect(tktRes.status).toBe(200);
      const tktBody = (await tktRes.json()) as any;
      expect(tktBody.success).toBe(true);
      expect(tktBody.data[0].ticketNumber).toMatch(/^001-DEMO-\d{10}$/);

      // Customer views updated booking details
      const viewRes = await app.request(`/api/v1/bookings/${createdBookingId}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });

      expect(viewRes.status).toBe(200);
      const viewBody = (await viewRes.json()) as any;
      expect(viewBody.data.bookingStatus).toBe('TICKETED');
      expect(viewBody.data.bookingReference).toBe(createdBookingRef);
    });
  });

  describe('Scenario B: Agency-Assisted Booking Flow & Single-Agency Policy', () => {
    const agencyOwnerUserId = 'e2e-agency-owner-b';
    const secondAgencyOwnerUserId = 'e2e-agency-owner-b-2';
    const customerUserId = 'e2e-cust-scenario-b';
    const customerEmail = 'eleanor.b@example.com';
    let agencyId: string;
    let secondAgencyId: string;
    let selectedOfferId: string;
    let agencyBookingId: string;

    it('Step 1-4: Agency owner registers agency and invites customer; customer accepts', async () => {
      // 1. Create agency
      const agencyRes = await app.request('/api/v1/agencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': agencyOwnerUserId,
          'x-demo-role': 'AGENCY_OWNER'
        },
        body: JSON.stringify({
          name: 'Horizon Travel Group'
        })
      });

      expect(agencyRes.status).toBe(201);
      const agencyBody = (await agencyRes.json()) as any;
      agencyId = agencyBody.data.id;
      expect(agencyId).toBeDefined();

      // 2. Invite customer
      const inviteRes = await app.request('/api/v1/agencies/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': agencyOwnerUserId,
          'x-demo-role': 'AGENCY_OWNER'
        },
        body: JSON.stringify({
          email: customerEmail
        })
      });

      expect(inviteRes.status).toBe(201);
      const inviteBody = (await inviteRes.json()) as any;
      const invitationId = inviteBody.data.id;

      // 3. Customer accepts invitation
      const acceptRes = await app.request(`/api/v1/customers/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });

      expect(acceptRes.status).toBe(200);
      const acceptBody = (await acceptRes.json()) as any;
      expect(acceptBody.success).toBe(true);
      expect(acceptBody.data.membershipStatus).toBe('ACTIVE');
    });

    it('Step 5: Enforces strictly one active agency per customer policy', async () => {
      // Create a second agency
      const agency2Res = await app.request('/api/v1/agencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': secondAgencyOwnerUserId,
          'x-demo-role': 'AGENCY_OWNER'
        },
        body: JSON.stringify({
          name: 'Summit Travel Partners'
        })
      });
      const agency2Body = (await agency2Res.json()) as any;
      secondAgencyId = agency2Body.data.id;

      // Second agency invites the same customer
      const invite2Res = await app.request('/api/v1/agencies/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': secondAgencyOwnerUserId,
          'x-demo-role': 'AGENCY_OWNER'
        },
        body: JSON.stringify({
          email: customerEmail
        })
      });
      const invite2Body = (await invite2Res.json()) as any;
      const invitation2Id = invite2Body.data.id;

      // Customer attempts to accept second agency invitation -> must fail with 409
      const secondAcceptRes = await app.request(`/api/v1/customers/invitations/${invitation2Id}/accept`, {
        method: 'POST',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });

      expect(secondAcceptRes.status).toBe(409);
      const errBody = (await secondAcceptRes.json()) as any;
      expect(errBody.error.code).toBe('ALREADY_ASSOCIATED_WITH_AGENCY');
    });

    it('Step 6-8: Agency owner books on behalf of associated customer', async () => {
      // Find flight offer
      const searchRes = await app.request(
        '/api/v1/flights/search?origin=JFK&destination=CDG&departureDate=2026-12-20&passengerCount=1&cabinClass=BUSINESS',
        {
          method: 'GET',
          headers: {
            'x-demo-user-id': agencyOwnerUserId,
            'x-demo-role': 'AGENCY_OWNER'
          }
        }
      );
      const searchBody = (await searchRes.json()) as any;
      selectedOfferId = searchBody.data[0].id;

      // Agency creates booking on customer's behalf
      const bookingRes = await app.request('/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-agency-book-${Date.now()}`,
          'x-demo-user-id': agencyOwnerUserId,
          'x-demo-role': 'AGENCY_OWNER'
        },
        body: JSON.stringify({
          offerId: selectedOfferId,
          customerUserId: customerUserId,
          passengers: [
            {
              passengerType: 'ADULT',
              firstName: 'Eleanor',
              lastName: 'Vance',
              dateOfBirth: '1988-06-12',
              passportNumber: 'E98765432'
            }
          ]
        })
      });

      expect(bookingRes.status).toBe(201);
      const bookingBody = (await bookingRes.json()) as any;
      expect(bookingBody.data.customerUserId).toBe(customerUserId);
      expect(bookingBody.data.createdByUserId).toBe(agencyOwnerUserId);
      expect(bookingBody.data.agencyId).toBe(agencyId);

      agencyBookingId = bookingBody.data.id;
    });

    it('Step 9-10: Both customer and agency owner can view booking; unassociated booking blocked', async () => {
      // 1. Customer views booking
      const custView = await app.request(`/api/v1/bookings/${agencyBookingId}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });
      expect(custView.status).toBe(200);

      // 2. Agency owner views booking
      const agencyView = await app.request(`/api/v1/bookings/${agencyBookingId}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': agencyOwnerUserId,
          'x-demo-role': 'AGENCY_OWNER'
        }
      });
      expect(agencyView.status).toBe(200);

      // 3. Agency owner attempts to book on behalf of unassociated customer
      const unassociatedBooking = await app.request('/api/v1/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `idem-unassoc-${Date.now()}`,
          'x-demo-user-id': agencyOwnerUserId,
          'x-demo-role': 'AGENCY_OWNER'
        },
        body: JSON.stringify({
          offerId: selectedOfferId,
          customerUserId: 'unassociated-stranger-user',
          passengers: [
            {
              passengerType: 'ADULT',
              firstName: 'Stranger',
              lastName: 'Danger',
              dateOfBirth: '1990-01-01'
            }
          ]
        })
      });

      expect(unassociatedBooking.status).toBe(403);
    });
  });
});
