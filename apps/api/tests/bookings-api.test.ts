import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index';
import { defaultFlightSupplier } from '../src/modules/supplier/mock-supplier';
import type { FlightOffer } from '@travel-platform/shared';

describe('Booking REST API Endpoints', () => {
  let sampleOffer: FlightOffer;
  const customer1Id = 'user-api-customer-1';
  const customer2Id = 'user-api-customer-2';

  beforeAll(async () => {
    const offers = await defaultFlightSupplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-20',
      passengerCount: 1,
      cabinClass: 'ECONOMY'
    });
    expect(offers.length).toBeGreaterThan(0);
    sampleOffer = offers[0]!;
  });

  it('rejects POST /api/v1/bookings when unauthenticated with 401', async () => {
    const res = await app.request('/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': 'idem-unauth-test'
      },
      body: JSON.stringify({
        offerId: sampleOffer.id,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Alice',
            lastName: 'Wonderland',
            dateOfBirth: '1990-01-01'
          }
        ]
      })
    });

    expect(res.status).toBe(401);
  });

  it('rejects POST /api/v1/bookings when Idempotency-Key header is missing with 400', async () => {
    const res = await app.request('/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user-id': customer1Id,
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        offerId: sampleOffer.id,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Alice',
            lastName: 'Wonderland',
            dateOfBirth: '1990-01-01'
          }
        ]
      })
    });

    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error?.code).toBe('MISSING_IDEMPOTENCY_KEY');
  });

  it('creates booking via POST /api/v1/bookings with 201', async () => {
    const idemKey = `idem-api-post-${Date.now()}`;
    const res = await app.request('/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
        'x-demo-user-id': customer1Id,
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        offerId: sampleOffer.id,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1988-11-23'
          }
        ]
      })
    });

    expect(res.status).toBe(201);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBeDefined();
    expect(body.data.bookingReference).toMatch(/^BK-[A-Z0-9]{6}$/);
    expect(body.data.pnr).toBeDefined();
    expect(body.data.totalAmount).toBe(sampleOffer.totalAmount);
    expect(body.data.passengers[0].firstName).toBe('John');
  });

  it('lists bookings for authenticated customer via GET /api/v1/bookings', async () => {
    const res = await app.request('/api/v1/bookings', {
      method: 'GET',
      headers: {
        'x-demo-user-id': customer1Id,
        'x-demo-role': 'CUSTOMER'
      }
    });

    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('fetches booking details and enforces privacy between customers', async () => {
    // Create a booking for customer1
    const idemKey = `idem-privacy-${Date.now()}`;
    const createRes = await app.request('/api/v1/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idemKey,
        'x-demo-user-id': customer1Id,
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        offerId: sampleOffer.id,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Private',
            lastName: 'Passenger',
            dateOfBirth: '1991-04-10'
          }
        ]
      })
    });
    const created: any = await createRes.json();
    const bookingId = created.data.id;


    // Customer 1 can access their booking
    const res1 = await app.request(`/api/v1/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        'x-demo-user-id': customer1Id,
        'x-demo-role': 'CUSTOMER'
      }
    });
    expect(res1.status).toBe(200);

    // Customer 2 cannot access Customer 1's booking
    const res2 = await app.request(`/api/v1/bookings/${bookingId}`, {
      method: 'GET',
      headers: {
        'x-demo-user-id': customer2Id,
        'x-demo-role': 'CUSTOMER'
      }
    });
    expect(res2.status).toBe(403);
  });
});
