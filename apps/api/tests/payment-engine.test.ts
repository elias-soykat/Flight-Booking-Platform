import { describe, it, expect, beforeAll } from 'vitest';
import { paymentService } from '../src/modules/payment/service';
import { bookingService } from '../src/modules/booking/service';

import { defaultFlightSupplier } from '../src/modules/supplier/mock-supplier';
import type { BookingEntity, FlightOffer } from '@travel-platform/shared';

describe('Payment Simulation & Ticketing Domain Service', () => {
  let sampleOffer: FlightOffer;
  let testBooking: BookingEntity;
  const customerUserId = 'user-pay-test-cust-1';

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
          dateOfBirth: '1985-02-28',
          passportNumber: 'P98765432'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-pay-test-booking-${Date.now()}`
    });
  });

  it('processes successful payment, generates 13-digit tickets, and transitions booking to TICKETED', async () => {
    const idempotencyKey = `idem-pay-success-${Date.now()}`;
    const result = await paymentService.processPayment({
      bookingId: testBooking.id,
      scenario: 'SUCCESS',
      idempotencyKey,
      userId: customerUserId,
      userRole: 'CUSTOMER'
    });

    expect(result.payment).toBeDefined();
    expect(result.payment.status).toBe('SUCCEEDED');
    expect(result.payment.amount).toBe(testBooking.totalAmount);
    expect(result.payment.paymentReference).toMatch(/^PAY-[A-Z0-9]{6}$/);

    // Verify tickets
    expect(result.tickets).toHaveLength(1);
    const ticket = result.tickets[0]!;
    expect(ticket.ticketNumber).toMatch(/^001-DEMO-\d{10}$/);
    expect(ticket.passengerName).toBe('Sarah Connor');
    expect(ticket.issuanceMethod).toBe('AUTOMATIC_SIMULATED');

    // Verify booking updated to TICKETED
    const updated = await bookingService.getBookingById(testBooking.id, customerUserId, 'CUSTOMER');
    expect(updated?.bookingStatus).toBe('TICKETED');
  });

  it('enforces idempotency on duplicate payment attempts with same key', async () => {
    // Create new booking for idempotency test
    const booking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Kyle',
          lastName: 'Reese',
          dateOfBirth: '1983-11-15'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-kyle-${Date.now()}`
    });

    const idemKey = `idem-pay-dup-${Date.now()}`;
    const firstAttempt = await paymentService.processPayment({
      bookingId: booking.id,
      scenario: 'SUCCESS',
      idempotencyKey: idemKey,
      userId: customerUserId,
      userRole: 'CUSTOMER'
    });

    const secondAttempt = await paymentService.processPayment({
      bookingId: booking.id,
      scenario: 'SUCCESS',
      idempotencyKey: idemKey,
      userId: customerUserId,
      userRole: 'CUSTOMER'
    });

    expect(secondAttempt.payment.id).toBe(firstAttempt.payment.id);
    expect(secondAttempt.payment.paymentReference).toBe(firstAttempt.payment.paymentReference);
    expect(secondAttempt.payment.status).toBe('SUCCEEDED');
  });

  it('handles simulated DECLINE scenario and keeps booking in CONFIRMED unpaid state', async () => {
    const booking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Declined',
          lastName: 'User',
          dateOfBirth: '1990-01-01'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-dec-book-${Date.now()}`
    });

    const result = await paymentService.processPayment({
      bookingId: booking.id,
      scenario: 'DECLINE',
      idempotencyKey: `idem-dec-pay-${Date.now()}`,
      userId: customerUserId,
      userRole: 'CUSTOMER'
    });

    expect(result.payment.status).toBe('FAILED');
    expect(result.payment.failureReason).toContain('declined');
    expect(result.tickets).toHaveLength(0);

    const check = await bookingService.getBookingById(booking.id, customerUserId, 'CUSTOMER');
    expect(check?.bookingStatus).toBe('CONFIRMED');
  });

  it('handles simulated TIMEOUT scenario and transitions payment to UNKNOWN state', async () => {
    const booking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Timeout',
          lastName: 'User',
          dateOfBirth: '1992-06-10'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-to-book-${Date.now()}`
    });

    const result = await paymentService.processPayment({
      bookingId: booking.id,
      scenario: 'TIMEOUT',
      idempotencyKey: `idem-to-pay-${Date.now()}`,
      userId: customerUserId,
      userRole: 'CUSTOMER'
    });

    expect(result.payment.status).toBe('UNKNOWN');
    expect(result.tickets).toHaveLength(0);

    // Verify unreconciled list contains this payment
    const unreconciled = await paymentService.getUnreconciledPayments();
    expect(unreconciled.some(p => p.id === result.payment.id)).toBe(true);

    // Admin reconciles payment with FORCE_SUCCESS
    const reconciled = await paymentService.reconcilePayment({
      paymentId: result.payment.id,
      action: 'FORCE_SUCCESS',
      note: 'Verified with simulated bank settlement',
      adminUserId: 'admin-user-id'
    });

    expect(reconciled.payment.status).toBe('RECONCILED');
    expect(reconciled.tickets).toHaveLength(1);
    expect(reconciled.tickets[0]!.ticketNumber).toMatch(/^001-DEMO-\d{10}$/);

    const postCheck = await bookingService.getBookingById(booking.id, customerUserId, 'CUSTOMER');
    expect(postCheck?.bookingStatus).toBe('TICKETED');
  });

  it('allows administrator to manually issue mock tickets for ticketing queue', async () => {
    const booking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Manual',
          lastName: 'Fulfillment',
          dateOfBirth: '1987-04-12'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey: `idem-man-book-${Date.now()}`
    });

    const tickets = await paymentService.issueTicketsManually(booking.id, 'admin-user-id');
    expect(tickets).toHaveLength(1);
    expect(tickets[0]!.issuanceMethod).toBe('ADMIN_MANUAL');
    expect(tickets[0]!.issuedByUserId).toBe('admin-user-id');
    expect(tickets[0]!.ticketNumber).toMatch(/^001-DEMO-\d{10}$/);

    const postCheck = await bookingService.getBookingById(booking.id, customerUserId, 'CUSTOMER');
    expect(postCheck?.bookingStatus).toBe('TICKETED');
  });
});
