import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index';
import { defaultFlightSupplier } from '../src/modules/supplier/mock-supplier';
import { bookingService } from '../src/modules/booking/service';
import type { BookingEntity, FlightOffer } from '@travel-platform/shared';

describe('Payment & Reconciliation REST API Endpoints', () => {
  let sampleOffer: FlightOffer;
  let testBooking: BookingEntity;
  const customerUserId = 'user-api-pay-cust-1';
  const adminUserId = 'user-api-admin-1';

  beforeAll(async () => {
    const offers = await defaultFlightSupplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-30',
      passengerCount: 1,
      cabinClass: 'ECONOMY'
    });
    expect(offers.length).toBeGreaterThan(0);
    sampleOffer = offers[0]!;

    testBooking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'John',
          lastName: 'Matrix',
          dateOfBirth: '1975-09-12'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-pay-api-book-${Date.now()}`
    });
  });

  it('rejects payment request without Idempotency-Key with 400', async () => {
    const res = await app.request(`/api/v1/bookings/${testBooking.id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        simulationScenario: 'SUCCESS'
      })
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error?.code).toBe('MISSING_IDEMPOTENCY_KEY');
  });

  it('processes payment with SUCCESS scenario and returns 201 with tickets', async () => {
    const res = await app.request(`/api/v1/bookings/${testBooking.id}/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `idem-pay-route-${Date.now()}`,
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        simulationScenario: 'SUCCESS'
      })
    });

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.payment.status).toBe('SUCCEEDED');
    expect(body.data.payment.paymentReference).toMatch(/^PAY-[A-Z0-9]{6}$/);
    expect(body.data.tickets).toHaveLength(1);
    expect(body.data.tickets[0].ticketNumber).toMatch(/^001-DEMO-\d{10}$/);
  });

  it('fetches tickets for a booked and ticketed flight', async () => {
    const res = await app.request(`/api/v1/bookings/${testBooking.id}/tickets`, {
      method: 'GET',
      headers: {
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      }
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data[0].ticketNumber).toMatch(/^001-DEMO-\d{10}$/);
  });

  it('blocks non-admin users from reconciling payments with 403', async () => {
    const res = await app.request('/api/v1/payments/pay-12345/reconcile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        action: 'FORCE_SUCCESS',
        note: 'Unauthorized attempt'
      })
    });

    expect(res.status).toBe(403);
  });

  it('allows administrator to view ticketing queue and issue tickets manually', async () => {
    // Create new booking that will require ticketing
    const unfulfilledBooking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Manual',
          lastName: 'Queued',
          dateOfBirth: '1989-10-10'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-unfulfilled-${Date.now()}`
    });

    // Admin views queue
    const queueRes = await app.request('/api/v1/admin/ticketing-queue', {
      method: 'GET',
      headers: {
        'x-demo-user-id': adminUserId,
        'x-demo-role': 'ADMIN'
      }
    });
    expect(queueRes.status).toBe(200);

    // Admin manually issues tickets
    const issueRes = await app.request(`/api/v1/admin/bookings/${unfulfilledBooking.id}/issue-tickets`, {
      method: 'POST',
      headers: {
        'x-demo-user-id': adminUserId,
        'x-demo-role': 'ADMIN'
      }
    });

    expect(issueRes.status).toBe(200);
    const issueBody: any = await issueRes.json();
    expect(issueBody.success).toBe(true);
    expect(issueBody.data[0].issuanceMethod).toBe('ADMIN_MANUAL');
    expect(issueBody.data[0].ticketNumber).toMatch(/^001-DEMO-\d{10}$/);
  });
});
