import { describe, it, expect, beforeAll } from 'vitest';
import { bookingService, BookingError } from '../src/modules/booking/service';
import { defaultFlightSupplier } from '../src/modules/supplier/mock-supplier';
import { agencyService } from '../src/modules/agency/service';
import type { FlightOffer } from '@travel-platform/shared';

describe('Booking Engine Domain Service & Idempotency Store', () => {
  let sampleOffer: FlightOffer;
  const customerUserId = 'user-customer-test-1';
  const agencyOwnerUserId = 'user-agency-owner-test-1';
  const associatedCustomerUserId = 'user-customer-associated-1';
  const unassociatedCustomerUserId = 'user-customer-unassociated-1';
  let agencyId: string;

  beforeAll(async () => {

    // Generate sample flight offer
    const offers = await defaultFlightSupplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-15',
      passengerCount: 1,
      cabinClass: 'ECONOMY'
    });
    expect(offers.length).toBeGreaterThan(0);
    sampleOffer = offers[0]!;

    // Set up agency and association
    const agency = await agencyService.createAgency(agencyOwnerUserId, 'Atlas Travel Corp');
    agencyId = agency.id;

    // Associate customer 1
    const { invitation } = await agencyService.createInvitation(agencyId, 'associated@test.com');
    await agencyService.acceptInvitation(invitation.id, associatedCustomerUserId);
  });

  it('allows a direct customer to create a booking with immutable price snapshot and mock PNR', async () => {
    const idempotencyKey = `idem-${Date.now()}-direct-1`;
    const booking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Alice',
          lastName: 'Smith',
          dateOfBirth: '1990-05-14',
          passportNumber: 'P12345678'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey
    });

    expect(booking).toBeDefined();
    expect(booking.id).toBeDefined();
    expect(booking.bookingReference).toMatch(/^BK-[A-Z0-9]{6}$/);
    expect(booking.pnr).toMatch(/^[2-9A-Z]{6}$/);
    expect(booking.bookingStatus).toBe('CONFIRMED');
    expect(booking.customerUserId).toBe(customerUserId);
    expect(booking.createdByUserId).toBe(customerUserId);
    expect(booking.agencyId).toBeUndefined();

    // Verify immutable price snapshot
    expect(booking.baseFare).toBe(sampleOffer.baseFare);
    expect(booking.markupAmount).toBe(sampleOffer.markupAmount);
    expect(booking.totalAmount).toBe(sampleOffer.totalAmount);
    expect(booking.currency).toBe('USD');

    // Verify passengers and events
    expect(booking.passengers).toHaveLength(1);
    expect(booking.passengers[0]!.firstName).toBe('Alice');
    expect(booking.events).toHaveLength(1);
    expect(booking.events[0]!.eventType).toBe('BOOKING_CREATED');
  });

  it('returns cached booking on duplicate creation with identical idempotencyKey', async () => {
    const idempotencyKey = `idem-${Date.now()}-dup-test`;
    const firstBooking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Bob',
          lastName: 'Jones',
          dateOfBirth: '1985-08-20'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey
    });

    const secondBooking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Bob',
          lastName: 'Jones',
          dateOfBirth: '1985-08-20'
        }
      ],
      userId: customerUserId,
      userRole: 'CUSTOMER',
      idempotencyKey
    });

    expect(secondBooking.id).toBe(firstBooking.id);
    expect(secondBooking.bookingReference).toBe(firstBooking.bookingReference);
    expect(secondBooking.pnr).toBe(firstBooking.pnr);
  });

  it('allows an agency owner to create a booking on behalf of an associated customer', async () => {
    const idempotencyKey = `idem-${Date.now()}-agency-booking-1`;
    const booking = await bookingService.createBooking({
      offerId: sampleOffer.id,
      customerUserId: associatedCustomerUserId,
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Charlie',
          lastName: 'Brown',
          dateOfBirth: '1992-03-12'
        }
      ],
      userId: agencyOwnerUserId,
      userRole: 'AGENCY_OWNER',
      idempotencyKey
    });

    expect(booking.agencyId).toBe(agencyId);
    expect(booking.customerUserId).toBe(associatedCustomerUserId);
    expect(booking.createdByUserId).toBe(agencyOwnerUserId);
    expect(booking.bookingStatus).toBe('CONFIRMED');
  });

  it('rejects booking when agency owner attempts to book for unassociated customer', async () => {
    const idempotencyKey = `idem-${Date.now()}-unassociated-test`;

    await expect(
      bookingService.createBooking({
        offerId: sampleOffer.id,
        customerUserId: unassociatedCustomerUserId,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Eve',
            lastName: 'Hacker',
            dateOfBirth: '1995-01-01'
          }
        ],
        userId: agencyOwnerUserId,
        userRole: 'AGENCY_OWNER',
        idempotencyKey
      })
    ).rejects.toThrow(BookingError);

    try {
      await bookingService.createBooking({
        offerId: sampleOffer.id,
        customerUserId: unassociatedCustomerUserId,
        passengers: [
          {
            passengerType: 'ADULT',
            firstName: 'Eve',
            lastName: 'Hacker',
            dateOfBirth: '1995-01-01'
          }
        ],
        userId: agencyOwnerUserId,
        userRole: 'AGENCY_OWNER',
        idempotencyKey
      });
    } catch (err: any) {
      expect(err.code).toBe('CUSTOMER_NOT_ASSOCIATED');
    }
  });

  it('filters booking listing strictly by role and tenancy', async () => {
    const customerList = await bookingService.listBookings(customerUserId, 'CUSTOMER');
    expect(customerList.every(b => b.customerUserId === customerUserId)).toBe(true);

    const agencyList = await bookingService.listBookings(agencyOwnerUserId, 'AGENCY_OWNER');
    expect(agencyList.every(b => b.agencyId === agencyId || b.createdByUserId === agencyOwnerUserId)).toBe(true);

    const adminList = await bookingService.listBookings('admin-user-id', 'ADMIN');
    expect(adminList.length).toBeGreaterThanOrEqual(customerList.length);
  });
});
