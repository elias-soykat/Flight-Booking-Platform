import type {
  BookingStatus,
  PassengerInput,
  UserRole,
  BookingEntity,
  BookingPassengerEntity,
  BookingEventEntity
} from '@travel-platform/shared';

import { defaultFlightSupplier } from '../supplier/mock-supplier';
import { agencyService } from '../agency/service';

export type { BookingEntity, BookingPassengerEntity, BookingEventEntity };


export interface CreateBookingParams {
  offerId: string;
  passengers: PassengerInput[];
  customerUserId?: string;
  userId: string;
  userRole: UserRole;
  idempotencyKey: string;
}

export class BookingError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'BookingError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// In-memory storage for bookings and idempotency
const bookingsStore = new Map<string, BookingEntity>();
const idempotencyStore = new Map<string, BookingEntity>();

export const bookingService = {
  async createBooking(params: CreateBookingParams): Promise<BookingEntity> {
    const { offerId, passengers, customerUserId, userId, userRole, idempotencyKey } = params;

    // 1. Idempotency Check: repeated requests with identical key return existing booking
    const cachedBooking = idempotencyStore.get(idempotencyKey);
    if (cachedBooking) {
      return cachedBooking;
    }

    // 2. Tenancy & Permission Checks
    let finalCustomerUserId = userId;
    let finalAgencyId: string | undefined = undefined;

    if (userRole === 'AGENCY_OWNER') {
      const agency = await agencyService.getAgencyByOwner(userId);
      if (!agency) {
        throw new BookingError('AGENCY_NOT_FOUND', 'Agency organization not found for user', 404);
      }
      finalAgencyId = agency.id;

      if (!customerUserId) {
        throw new BookingError(
          'CUSTOMER_REQUIRED',
          'Customer user ID is required when booking as an agency owner',
          400
        );
      }

      // Customer must be actively associated with this agency
      const activeMembership = await agencyService.getActiveMembershipForCustomer(customerUserId);
      if (!activeMembership || activeMembership.agencyId !== agency.id) {
        throw new BookingError(
          'CUSTOMER_NOT_ASSOCIATED',
          'Customer is not actively associated with your agency. Cannot book on their behalf.',
          403
        );
      }

      finalCustomerUserId = customerUserId;
    } else if (userRole === 'CUSTOMER') {
      finalCustomerUserId = userId;
    } else if (userRole === 'ADMIN') {
      finalCustomerUserId = customerUserId || userId;
    }

    // 3. Offer & Fare Validation
    const offer = await defaultFlightSupplier.getOfferDetails(offerId);
    if (!offer) {
      throw new BookingError('OFFER_NOT_FOUND', `Flight offer '${offerId}' was not found or has expired`, 404);
    }

    const fareCheck = await defaultFlightSupplier.validateFare(offer.supplierOfferReference, passengers.length);
    if (!fareCheck.valid) {
      throw new BookingError('FARE_INVALID', fareCheck.reason || 'Flight fare is no longer valid', 400);
    }

    // 4. Supplier Reservation & Mock PNR
    const reservation = await defaultFlightSupplier.createReservation({
      offerReference: offer.supplierOfferReference,
      passengers
    });

    if (!reservation.success || !reservation.pnr || !reservation.supplierBookingReference) {
      throw new BookingError(
        'RESERVATION_FAILED',
        reservation.failureReason || 'Failed to confirm reservation with flight supplier',
        502
      );
    }

    // 5. Generate human-readable booking reference BK-XXXXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let refSuffix = '';
    for (let i = 0; i < 6; i++) {
      refSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const bookingReference = `BK-${refSuffix}`;

    const now = new Date().toISOString();
    const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const passengerEntities: BookingPassengerEntity[] = passengers.map((p, index) => ({
      id: `pax-${bookingId}-${index + 1}`,
      passengerType: p.passengerType,
      firstName: p.firstName,
      lastName: p.lastName,
      dateOfBirth: p.dateOfBirth,
      passportNumber: p.passportNumber
    }));

    const initialEvent: BookingEventEntity = {
      id: `evt-${bookingId}-1`,
      eventType: 'BOOKING_CREATED',
      previousStatus: null,
      newStatus: 'CONFIRMED',
      actorUserId: userId,
      metadata: {
        inventorySource: offer.inventorySource,
        supplierOfferReference: offer.supplierOfferReference,
        pnr: reservation.pnr
      },
      createdAt: now
    };

    // 6. Immutable Price Snapshot
    const booking: BookingEntity = {
      id: bookingId,
      bookingReference,
      customerUserId: finalCustomerUserId,
      createdByUserId: userId,
      agencyId: finalAgencyId,
      supplierId: offer.supplierId,
      inventorySource: 'MOCK',
      supplierBookingReference: reservation.supplierBookingReference,
      pnr: reservation.pnr,
      bookingStatus: 'CONFIRMED',
      currency: offer.currency,
      baseFare: offer.baseFare,
      markupAmount: offer.markupAmount,
      totalAmount: offer.totalAmount,
      idempotencyKey,
      flightOffer: offer,
      passengers: passengerEntities,
      events: [initialEvent],
      createdAt: now,
      updatedAt: now
    };

    // 7. Store and cache
    bookingsStore.set(booking.id, booking);
    idempotencyStore.set(idempotencyKey, booking);

    return booking;
  },

  async getBookingById(bookingId: string, userId: string, userRole: UserRole): Promise<BookingEntity | null> {
    const booking = bookingsStore.get(bookingId);
    if (!booking) {
      return null;
    }

    if (userRole === 'ADMIN') {
      return booking;
    }

    if (userRole === 'CUSTOMER') {
      if (booking.customerUserId !== userId) {
        throw new BookingError('FORBIDDEN', 'Access to this booking is unauthorized', 403);
      }
      return booking;
    }

    if (userRole === 'AGENCY_OWNER') {
      const agency = await agencyService.getAgencyByOwner(userId);
      const isAgencyMatch = agency && booking.agencyId === agency.id;
      const isCreatorMatch = booking.createdByUserId === userId;
      if (!isAgencyMatch && !isCreatorMatch) {
        throw new BookingError('FORBIDDEN', 'Access to this agency booking is unauthorized', 403);
      }
      return booking;
    }

    return null;
  },

  async listBookings(userId: string, userRole: UserRole): Promise<BookingEntity[]> {
    const all = Array.from(bookingsStore.values());

    if (userRole === 'ADMIN') {
      return all;
    }

    if (userRole === 'CUSTOMER') {
      return all.filter(b => b.customerUserId === userId);
    }

    if (userRole === 'AGENCY_OWNER') {
      const agency = await agencyService.getAgencyByOwner(userId);
      return all.filter(b => (agency && b.agencyId === agency.id) || b.createdByUserId === userId);
    }

    return [];
  },

  async updateBookingStatus(
    bookingId: string,
    newStatus: BookingStatus,
    actorUserId?: string,
    metadata?: Record<string, unknown>
  ): Promise<BookingEntity> {
    const booking = bookingsStore.get(bookingId);
    if (!booking) {
      throw new BookingError('BOOKING_NOT_FOUND', 'Booking not found', 404);
    }

    const previousStatus = booking.bookingStatus;
    booking.bookingStatus = newStatus;
    booking.updatedAt = new Date().toISOString();

    const event: BookingEventEntity = {
      id: `evt-${bookingId}-${booking.events.length + 1}`,
      eventType: `STATUS_CHANGED_TO_${newStatus}`,
      previousStatus,
      newStatus,
      actorUserId,
      metadata,
      createdAt: booking.updatedAt
    };

    booking.events.push(event);
    return booking;
  }
};
