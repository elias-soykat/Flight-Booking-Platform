import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { cancellationService } from '../src/modules/cancellation/service';
import { bookingService } from '../src/modules/booking/service';
import { paymentService } from '../src/modules/payment/service';
import { auditService } from '../src/modules/audit/service';
import { defaultFlightSupplier } from '../src/modules/supplier/mock-supplier';
import type { FlightOffer } from '@travel-platform/shared';

describe('Cancellation Domain Service & State Machine', () => {
  let sampleOffer: FlightOffer;
  let customerBooking: any;
  let ticketedBooking: any;

  beforeAll(async () => {
    const offers = await defaultFlightSupplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-15',
      passengerCount: 1,
      cabinClass: 'ECONOMY'
    });
    sampleOffer = offers[0]!;
  });

  beforeEach(async () => {
    // Create a confirmed booking for customer-1
    customerBooking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Alice',
          lastName: 'Smith',
          dateOfBirth: '1990-01-01',
          passportNumber: 'P12345678'
        }
      ],
      userId: 'customer-1',
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-cancel-${Date.now()}-${Math.random()}`
    });

    // Create and ticket a booking for customer-2
    ticketedBooking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Bob',
          lastName: 'Jones',
          dateOfBirth: '1985-05-15',
          passportNumber: 'P87654321'
        }
      ],
      userId: 'customer-2',
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-ticket-${Date.now()}-${Math.random()}`
    });

    await paymentService.processPayment({
      bookingId: ticketedBooking.id,
      scenario: 'SUCCESS',
      idempotencyKey: `pay-${ticketedBooking.id}`,
      userId: 'customer-2',
      userRole: 'CUSTOMER'
    });
  });

  it('allows customer to submit a cancellation request, transitions to CANCELLATION_PENDING, and logs audit', async () => {
    const request = await cancellationService.requestCancellation({
      bookingId: customerBooking.id,
      reason: 'Family emergency, cannot travel',
      userId: 'customer-1',
      userRole: 'CUSTOMER'
    });

    expect(request.id).toBeDefined();
    expect(request.bookingId).toBe(customerBooking.id);
    expect(request.bookingReference).toBe(customerBooking.bookingReference);
    expect(request.status).toBe('PENDING');
    expect(request.previousBookingStatus).toBe('CONFIRMED');

    // Verify booking updated to CANCELLATION_PENDING
    const updatedBooking = await bookingService.getBookingById(customerBooking.id, 'admin', 'ADMIN');
    expect(updatedBooking?.bookingStatus).toBe('CANCELLATION_PENDING');

    // Verify audit log recorded
    const logs = await auditService.listLogs(10);
    expect(logs.some(l => l.action === 'CANCELLATION_REQUESTED' && l.entityId === customerBooking.id)).toBe(true);
  });

  it('rejects cancellation request by unauthorized customer with 403', async () => {
    await expect(
      cancellationService.requestCancellation({
        bookingId: customerBooking.id,
        reason: 'Attempting to cancel someone else booking',
        userId: 'customer-unauthorized',
        userRole: 'CUSTOMER'
      })
    ).rejects.toThrow();
  });

  it('allows admin to approve a cancellation request, transitions booking to CANCELLED', async () => {
    const req = await cancellationService.requestCancellation({
      bookingId: ticketedBooking.id,
      reason: 'Customer requested refund before departure',
      userId: 'customer-2',
      userRole: 'CUSTOMER'
    });

    const reviewed = await cancellationService.reviewCancellation({
      requestId: req.id,
      decision: 'APPROVE',
      reviewNote: 'Cancellation approved per policy',
      adminUserId: 'admin-1'
    });

    expect(reviewed.status).toBe('APPROVED');
    expect(reviewed.reviewedByUserId).toBe('admin-1');

    const updatedBooking = await bookingService.getBookingById(ticketedBooking.id, 'admin', 'ADMIN');
    expect(updatedBooking?.bookingStatus).toBe('CANCELLED');

    const logs = await auditService.listLogs(10);
    expect(logs.some(l => l.action === 'CANCELLATION_APPROVED' && l.entityId === ticketedBooking.id)).toBe(true);
  });

  it('allows admin to reject a cancellation request, restoring booking to previousStatus', async () => {
    const req = await cancellationService.requestCancellation({
      bookingId: ticketedBooking.id,
      reason: 'Change of mind',
      userId: 'customer-2',
      userRole: 'CUSTOMER'
    });

    const reviewed = await cancellationService.reviewCancellation({
      requestId: req.id,
      decision: 'REJECT',
      reviewNote: 'Non-refundable fare class under promotional conditions',
      adminUserId: 'admin-1'
    });

    expect(reviewed.status).toBe('REJECTED');
    expect(reviewed.reviewedByUserId).toBe('admin-1');

    // Restores to TICKETED
    const updatedBooking = await bookingService.getBookingById(ticketedBooking.id, 'admin', 'ADMIN');
    expect(updatedBooking?.bookingStatus).toBe('TICKETED');

    const logs = await auditService.listLogs(10);
    expect(logs.some(l => l.action === 'CANCELLATION_REJECTED' && l.entityId === ticketedBooking.id)).toBe(true);
  });

  it('calculates real-time dashboard metrics dynamically from live records', async () => {
    // Create a pending cancellation
    await cancellationService.requestCancellation({
      bookingId: customerBooking.id,
      reason: 'Urgent schedule clash',
      userId: 'customer-1',
      userRole: 'CUSTOMER'
    });

    const metrics = await cancellationService.getDashboardMetrics();
    expect(metrics.totalBookings).toBeGreaterThanOrEqual(2);
    expect(metrics.ticketedBookings).toBeGreaterThanOrEqual(1);
    expect(metrics.pendingCancellations).toBeGreaterThanOrEqual(1);
    expect(metrics.operationalInterventionsRequired).toBeGreaterThanOrEqual(1);
  });
});
