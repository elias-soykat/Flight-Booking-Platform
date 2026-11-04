import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index';
import { defaultFlightSupplier } from '../src/modules/supplier/mock-supplier';
import { bookingService } from '../src/modules/booking/service';
import type { BookingEntity, FlightOffer } from '@travel-platform/shared';

describe('Cancellations & Admin Operations REST Endpoints', () => {
  let sampleOffer: FlightOffer;
  let testBooking: BookingEntity;
  const customerUserId = 'user-api-cancel-cust-1';
  const adminUserId = 'user-api-cancel-admin-1';

  beforeAll(async () => {
    const offers = await defaultFlightSupplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-28',
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
          firstName: 'Sarah',
          lastName: 'Connor',
          dateOfBirth: '1985-02-28'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-cancel-api-book-${Date.now()}`
    });
  });

  it('allows customer to request cancellation via POST /api/v1/bookings/:id/cancellation-requests', async () => {
    const res = await app.request(`/api/v1/bookings/${testBooking.id}/cancellation-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        reason: 'Medical condition prevents travel'
      })
    });

    expect(res.status).toBe(201);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('PENDING');
    expect(body.data.bookingId).toBe(testBooking.id);
  });

  it('retrieves cancellation request via GET /api/v1/bookings/:id/cancellation-requests', async () => {
    const res = await app.request(`/api/v1/bookings/${testBooking.id}/cancellation-requests`, {
      method: 'GET',
      headers: {
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      }
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.bookingId).toBe(testBooking.id);
  });

  it('rejects non-admin access to /api/v1/admin/dashboard and /admin/cancellations with 403', async () => {
    const resDash = await app.request('/api/v1/admin/dashboard', {
      method: 'GET',
      headers: {
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      }
    });
    expect(resDash.status).toBe(403);

    const resQueue = await app.request('/api/v1/admin/cancellations', {
      method: 'GET',
      headers: {
        'x-demo-user-id': customerUserId,
        'x-demo-role': 'CUSTOMER'
      }
    });
    expect(resQueue.status).toBe(403);
  });

  it('allows admin to fetch dashboard metrics via GET /api/v1/admin/dashboard', async () => {
    const res = await app.request('/api/v1/admin/dashboard', {
      method: 'GET',
      headers: {
        'x-demo-user-id': adminUserId,
        'x-demo-role': 'ADMIN'
      }
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.totalBookings).toBeGreaterThanOrEqual(1);
    expect(body.data.pendingCancellations).toBeGreaterThanOrEqual(1);
  });

  it('allows admin to review and approve cancellation request via POST /api/v1/admin/cancellations/:id/review', async () => {
    // Fetch queue to find the request id
    const queueRes = await app.request('/api/v1/admin/cancellations', {
      method: 'GET',
      headers: {
        'x-demo-user-id': adminUserId,
        'x-demo-role': 'ADMIN'
      }
    });

    const queueBody = (await queueRes.json()) as any;
    expect(queueBody.success).toBe(true);
    const pendingReq = queueBody.data.find((r: any) => r.bookingId === testBooking.id);
    expect(pendingReq).toBeDefined();

    const reviewRes = await app.request(`/api/v1/admin/cancellations/${pendingReq.id}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user-id': adminUserId,
        'x-demo-role': 'ADMIN'
      },
      body: JSON.stringify({
        decision: 'APPROVE',
        reviewNote: 'Cancellation approved by operations team'
      })
    });

    expect(reviewRes.status).toBe(200);
    const reviewBody = (await reviewRes.json()) as any;
    expect(reviewBody.success).toBe(true);
    expect(reviewBody.data.status).toBe('APPROVED');
  });

  it('allows admin to view system audit logs via GET /api/v1/admin/audit-logs', async () => {
    const res = await app.request('/api/v1/admin/audit-logs', {
      method: 'GET',
      headers: {
        'x-demo-user-id': adminUserId,
        'x-demo-role': 'ADMIN'
      }
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data.some((l: any) => l.action.startsWith('CANCELLATION_'))).toBe(true);
  });
});
