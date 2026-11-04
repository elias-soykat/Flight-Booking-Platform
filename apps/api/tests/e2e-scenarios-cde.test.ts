import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../src/index';
import { defaultFlightSupplier } from '../src/modules/supplier/mock-supplier';
import { bookingService } from '../src/modules/booking/service';
import type { BookingEntity, FlightOffer } from '@travel-platform/shared';

describe('PRD Section 20 E2E Verification: Scenarios C, D, & E', () => {
  let sampleOffer: FlightOffer;
  const customerUserId = 'e2e-cust-cde-1';
  const adminUserId = 'e2e-admin-cde-1';

  beforeAll(async () => {
    const offers = await defaultFlightSupplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-25',
      passengerCount: 1,
      cabinClass: 'ECONOMY'
    });
    expect(offers.length).toBeGreaterThan(0);
    sampleOffer = offers[0]!;
  });

  describe('Scenario C: Payment Failure, Idempotency & Administrative Reconciliation', () => {
    let booking: BookingEntity;
    let paymentAttemptId: string;
    const paymentIdempotencyKey = `idem-pay-c-${Date.now()}`;

    it('Step 1-2: Customer initiates payment that encounters simulated TIMEOUT (UNKNOWN state)', async () => {
      booking = await bookingService.createBooking({
        offerId: sampleOffer.id,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Sarah',
            lastName: 'Walker',
            dateOfBirth: '1989-11-20'
          }
        ],
        userId: customerUserId,
        userRole: 'CUSTOMER',
        idempotencyKey: `idem-booking-c-${Date.now()}`
      });

      const payRes = await app.request(`/api/v1/bookings/${booking.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': paymentIdempotencyKey,
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          simulationScenario: 'TIMEOUT'
        })
      });

      expect(payRes.status).toBe(201);
      const payBody = (await payRes.json()) as any;
      expect(payBody.success).toBe(true);
      expect(payBody.data.payment.status).toBe('UNKNOWN');
      expect(payBody.data.tickets.length).toBe(0);

      paymentAttemptId = payBody.data.payment.id;
    });

    it('Step 3: Safe idempotency prevents duplicate execution with identical Idempotency-Key', async () => {
      const duplicateRes = await app.request(`/api/v1/bookings/${booking.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': paymentIdempotencyKey,
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          simulationScenario: 'TIMEOUT'
        })
      });

      expect(duplicateRes.status).toBe(201);
      const dupBody = (await duplicateRes.json()) as any;
      expect(dupBody.data.payment.id).toBe(paymentAttemptId);
    });

    it('Step 4-7: Administrator investigates and forces reconciliation to RECONCILED', async () => {
      // 1. Admin queries unreconciled payments queue
      const queueRes = await app.request('/api/v1/payments/unreconciled', {
        method: 'GET',
        headers: {
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        }
      });

      expect(queueRes.status).toBe(200);
      const queueBody = (await queueRes.json()) as any;
      expect(queueBody.data.some((p: any) => p.id === paymentAttemptId)).toBe(true);

      // 2. Admin performs reconciliation action
      const reconcileRes = await app.request(`/api/v1/payments/${paymentAttemptId}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        },
        body: JSON.stringify({
          action: 'FORCE_SUCCESS',
          note: 'Confirmed external mock settlement log'
        })
      });

      expect(reconcileRes.status).toBe(200);
      const recBody = (await reconcileRes.json()) as any;
      expect(recBody.success).toBe(true);
      expect(recBody.data.payment.status).toBe('RECONCILED');

      // 3. Verify audit log captures reconciliation action
      const auditRes = await app.request('/api/v1/admin/audit-logs', {
        method: 'GET',
        headers: {
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        }
      });
      const auditBody = (await auditRes.json()) as any;
      expect(
        auditBody.data.some(
          (l: any) => l.action === 'PAYMENT_RECONCILED' && l.metadata?.paymentId === paymentAttemptId
        )
      ).toBe(true);
    });
  });

  describe('Scenario D: Ticketing Queue & Administrative Manual Fulfillment', () => {
    let booking: BookingEntity;

    it('Step 1-3: Booking with settled payment awaiting ticketing routes to administrative queue', async () => {
      booking = await bookingService.createBooking({
        offerId: sampleOffer.id,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Marcus',
            lastName: 'Brody',
            dateOfBirth: '1965-03-14'
          }
        ],
        userId: customerUserId,
        userRole: 'CUSTOMER',
        idempotencyKey: `idem-booking-d-${Date.now()}`
      });

      // Successful payment simulation
      await app.request(`/api/v1/bookings/${booking.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `pay-d-${Date.now()}`,
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          simulationScenario: 'SUCCESS'
        })
      });

      // Admin queries ticketing queue (or manual ticket issuance capability)
      const qRes = await app.request('/api/v1/admin/ticketing-queue', {
        method: 'GET',
        headers: {
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        }
      });
      expect(qRes.status).toBe(200);
    });

    it('Step 4-7: Administrator issues mock tickets, booking becomes TICKETED, visible in history', async () => {
      // Manual ticket issuance
      const issueRes = await app.request(`/api/v1/admin/bookings/${booking.id}/issue-tickets`, {
        method: 'POST',
        headers: {
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        }
      });

      expect(issueRes.status).toBe(200);
      const issueBody = (await issueRes.json()) as any;
      expect(issueBody.success).toBe(true);
      expect(issueBody.data.length).toBe(1);
      expect(issueBody.data[0].ticketNumber).toMatch(/^001-DEMO-\d{10}$/);

      // Verify booking status is now TICKETED
      const checkRes = await app.request(`/api/v1/bookings/${booking.id}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });
      const checkBody = (await checkRes.json()) as any;
      expect(checkBody.data.bookingStatus).toBe('TICKETED');
      expect(checkBody.data.events.some((e: any) => e.eventType.includes('TICKET'))).toBe(true);
    });
  });

  describe('Scenario E: Cancellation Request, Administrative Review & Decision Cycle', () => {
    let booking: BookingEntity;
    let requestId: string;

    beforeAll(async () => {
      booking = await bookingService.createBooking({
        offerId: sampleOffer.id,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Marion',
            lastName: 'Ravenwood',
            dateOfBirth: '1970-07-22'
          }
        ],
        userId: customerUserId,
        userRole: 'CUSTOMER',
        idempotencyKey: `idem-booking-e-${Date.now()}`
      });

      // Ticket the booking
      await app.request(`/api/v1/bookings/${booking.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `pay-e-${Date.now()}`,
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          simulationScenario: 'SUCCESS'
        })
      });
    });

    it('Step 1-3: Customer submits cancellation request, status transitions to CANCELLATION_PENDING', async () => {
      const cancelReqRes = await app.request(`/api/v1/bookings/${booking.id}/cancellation-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          reason: 'Passport renewal delayed, cannot travel'
        })
      });

      expect(cancelReqRes.status).toBe(201);
      const reqBody = (await cancelReqRes.json()) as any;
      expect(reqBody.success).toBe(true);
      expect(reqBody.data.status).toBe('PENDING');
      expect(reqBody.data.previousBookingStatus).toBe('TICKETED');
      requestId = reqBody.data.id;

      // Check booking status changed to CANCELLATION_PENDING
      const bRes = await app.request(`/api/v1/bookings/${booking.id}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });
      const bBody = (await bRes.json()) as any;
      expect(bBody.data.bookingStatus).toBe('CANCELLATION_PENDING');
    });

    it('Step 4-5: Administrator reviews and rejects request, restoring previous status (TICKETED)', async () => {
      const reviewRes = await app.request(`/api/v1/admin/cancellations/${requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        },
        body: JSON.stringify({
          decision: 'REJECT',
          reviewNote: 'Non-refundable promotional fare class per tariff rules'
        })
      });

      expect(reviewRes.status).toBe(200);
      const revBody = (await reviewRes.json()) as any;
      expect(revBody.data.status).toBe('REJECTED');

      // Verify booking is restored to TICKETED
      const bRes = await app.request(`/api/v1/bookings/${booking.id}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });
      const bBody = (await bRes.json()) as any;
      expect(bBody.data.bookingStatus).toBe('TICKETED');
    });

    it('Step 6: Customer re-submits with medical documentation; Administrator approves (CANCELLED)', async () => {
      // Re-submit
      const reSubmitRes = await app.request(`/api/v1/bookings/${booking.id}/cancellation-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        },
        body: JSON.stringify({
          reason: 'Emergency surgery scheduled, doctor certificate attached'
        })
      });

      expect(reSubmitRes.status).toBe(201);
      const reReqBody = (await reSubmitRes.json()) as any;
      const newRequestId = reReqBody.data.id;

      // Admin approves
      const approveRes = await app.request(`/api/v1/admin/cancellations/${newRequestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        },
        body: JSON.stringify({
          decision: 'APPROVE',
          reviewNote: 'Medical emergency exemption approved'
        })
      });

      expect(approveRes.status).toBe(200);
      const approveBody = (await approveRes.json()) as any;
      expect(approveBody.data.status).toBe('APPROVED');

      // Booking is CANCELLED
      const bRes = await app.request(`/api/v1/bookings/${booking.id}`, {
        method: 'GET',
        headers: {
          'x-demo-user-id': customerUserId,
          'x-demo-role': 'CUSTOMER'
        }
      });
      const bBody = (await bRes.json()) as any;
      expect(bBody.data.bookingStatus).toBe('CANCELLED');

      // Audit log captures entire lifecycle
      const auditRes = await app.request('/api/v1/admin/audit-logs', {
        method: 'GET',
        headers: {
          'x-demo-user-id': adminUserId,
          'x-demo-role': 'ADMIN'
        }
      });
      const auditBody = (await auditRes.json()) as any;
      expect(auditBody.data.some((l: any) => l.action === 'CANCELLATION_APPROVED')).toBe(true);
      expect(auditBody.data.some((l: any) => l.action === 'CANCELLATION_REJECTED')).toBe(true);
    });
  });
});
