import type {
  PaymentAttemptEntity,
  TicketEntity,
  SimulationScenario,
  UserRole
} from '@travel-platform/shared';
import { bookingService } from '../booking/service';
import { defaultFlightSupplier } from '../supplier/mock-supplier';

export class PaymentError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'PaymentError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface ProcessPaymentParams {
  bookingId: string;
  scenario?: SimulationScenario;
  idempotencyKey: string;
  userId: string;
  userRole: UserRole;
}

export interface ReconcilePaymentParams {
  paymentId: string;
  action: 'FORCE_SUCCESS' | 'FORCE_FAIL' | 'RETRY';
  note: string;
  adminUserId: string;
}

export interface ProcessPaymentResult {
  payment: PaymentAttemptEntity;
  tickets: TicketEntity[];
}

// In-memory storage for test/edge runtime
const paymentsStore = new Map<string, PaymentAttemptEntity>();
const ticketsStore = new Map<string, TicketEntity>();
const idempotencyStore = new Map<string, ProcessPaymentResult>();

export const paymentService = {
  async processPayment(params: ProcessPaymentParams): Promise<ProcessPaymentResult> {
    const { bookingId, scenario = 'SUCCESS', idempotencyKey, userId, userRole } = params;

    // 1. Idempotency Check
    const cached = idempotencyStore.get(idempotencyKey);
    if (cached) {
      return cached;
    }

    // 2. Fetch and Validate Booking
    const booking = await bookingService.getBookingById(bookingId, userId, userRole);
    if (!booking) {
      throw new PaymentError('BOOKING_NOT_FOUND', `Booking '${bookingId}' not found`, 404);
    }

    if (booking.bookingStatus === 'TICKETED') {
      throw new PaymentError('BOOKING_ALREADY_TICKETED', 'This booking has already been ticketed', 400);
    }

    if (booking.bookingStatus === 'CANCELLED') {
      throw new PaymentError('BOOKING_CANCELLED', 'Cannot process payment for a cancelled booking', 400);
    }

    const now = new Date().toISOString();
    const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Generate readable payment reference PAY-XXXXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let refSuffix = '';
    for (let i = 0; i < 6; i++) {
      refSuffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const paymentReference = `PAY-${refSuffix}`;

    let tickets: TicketEntity[] = [];

    // 3. Process Scenario
    let status: PaymentAttemptEntity['status'] = 'PROCESSING';
    let failureReason: string | undefined = undefined;

    if (scenario === 'SUCCESS') {
      status = 'SUCCEEDED';

      // Attempt automatic simulated ticketing
      const issuance = await defaultFlightSupplier.issueTicket(booking.supplierBookingReference);
      if (issuance.success) {
        // Generate mock 13-digit ticket numbers for each passenger
        tickets = booking.passengers.map((pax) => {
          const tktNumber = `001-DEMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
          const ticket: TicketEntity = {
            id: `tkt-${Date.now()}-${pax.id}`,
            bookingId: booking.id,
            passengerId: pax.id,
            passengerName: `${pax.firstName} ${pax.lastName}`,
            ticketNumber: tktNumber,
            issuanceMethod: 'AUTOMATIC_SIMULATED',
            issuedAt: now
          };
          ticketsStore.set(ticket.id, ticket);
          return ticket;
        });

        // Update booking to TICKETED
        await bookingService.updateBookingStatus(booking.id, 'TICKETED', userId, {
          paymentReference,
          ticketNumbers: tickets.map(t => t.ticketNumber)
        });
      }
    } else if (scenario === 'DECLINE') {
      status = 'FAILED';
      failureReason = 'Card declined by issuing bank';
      await bookingService.updateBookingStatus(booking.id, 'CONFIRMED', userId, {
        paymentAttemptFailed: true,
        reason: failureReason
      });
    } else if (scenario === 'TIMEOUT') {
      status = 'UNKNOWN';
      failureReason = 'Payment gateway timeout awaiting confirmation';
      await bookingService.updateBookingStatus(booking.id, 'CONFIRMED', userId, {
        paymentAttemptUnknown: true,
        reason: failureReason
      });
    } else if (scenario === 'INSUFFICIENT_FUNDS') {
      status = 'FAILED';
      failureReason = 'Insufficient funds in payment account';
      await bookingService.updateBookingStatus(booking.id, 'CONFIRMED', userId, {
        paymentAttemptFailed: true,
        reason: failureReason
      });
    }

    const payment: PaymentAttemptEntity = {
      id: paymentId,
      bookingId: booking.id,
      paymentReference,
      amount: booking.totalAmount,
      currency: booking.currency,
      status,
      scenario,
      failureReason,
      idempotencyKey,
      createdAt: now,
      updatedAt: now
    };

    paymentsStore.set(payment.id, payment);

    const result: ProcessPaymentResult = { payment, tickets };
    idempotencyStore.set(idempotencyKey, result);

    return result;
  },

  async reconcilePayment(params: ReconcilePaymentParams): Promise<ProcessPaymentResult> {
    const { paymentId, action, note, adminUserId } = params;
    const payment = paymentsStore.get(paymentId);
    if (!payment) {
      throw new PaymentError('PAYMENT_NOT_FOUND', `Payment attempt '${paymentId}' not found`, 404);
    }

    const now = new Date().toISOString();
    payment.reconciledAt = now;
    payment.reconciliationNote = note;
    payment.updatedAt = now;

    let tickets: TicketEntity[] = [];

    if (action === 'FORCE_SUCCESS') {
      payment.status = 'RECONCILED';
      payment.failureReason = undefined;

      // Ensure booking moves to TICKETED and tickets are issued
      const booking = await bookingService.getBookingById(payment.bookingId, adminUserId, 'ADMIN');
      if (booking) {
        const existingTickets = await this.getTicketsForBooking(booking.id);
        if (existingTickets.length > 0) {
          tickets = existingTickets;
        } else {
          tickets = booking.passengers.map((pax) => {
            const ticket: TicketEntity = {
              id: `tkt-${Date.now()}-${pax.id}`,
              bookingId: booking.id,
              passengerId: pax.id,
              passengerName: `${pax.firstName} ${pax.lastName}`,
              ticketNumber: `001-DEMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
              issuanceMethod: 'ADMIN_MANUAL',
              issuedByUserId: adminUserId,
              issuedAt: now
            };
            ticketsStore.set(ticket.id, ticket);
            return ticket;
          });
        }

        await bookingService.updateBookingStatus(booking.id, 'TICKETED', adminUserId, {
          reconciledBy: adminUserId,
          reconciliationNote: note,
          paymentReference: payment.paymentReference
        });
      }
    } else {
      payment.status = 'FAILED';
      payment.failureReason = `Reconciled as failed by administrator: ${note}`;
    }

    return { payment, tickets };
  },

  async issueTicketsManually(bookingId: string, adminUserId: string): Promise<TicketEntity[]> {
    const booking = await bookingService.getBookingById(bookingId, adminUserId, 'ADMIN');
    if (!booking) {
      throw new PaymentError('BOOKING_NOT_FOUND', `Booking '${bookingId}' not found`, 404);
    }

    const now = new Date().toISOString();
    const tickets = booking.passengers.map((pax) => {
      const ticket: TicketEntity = {
        id: `tkt-${Date.now()}-${pax.id}`,
        bookingId: booking.id,
        passengerId: pax.id,
        passengerName: `${pax.firstName} ${pax.lastName}`,
        ticketNumber: `001-DEMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        issuanceMethod: 'ADMIN_MANUAL',
        issuedByUserId: adminUserId,
        issuedAt: now
      };
      ticketsStore.set(ticket.id, ticket);
      return ticket;
    });

    await bookingService.updateBookingStatus(booking.id, 'TICKETED', adminUserId, {
      manuallyIssuedBy: adminUserId,
      ticketNumbers: tickets.map(t => t.ticketNumber)
    });

    return tickets;
  },

  async getPaymentsForBooking(bookingId: string): Promise<PaymentAttemptEntity[]> {
    return Array.from(paymentsStore.values()).filter(p => p.bookingId === bookingId);
  },

  async getTicketsForBooking(bookingId: string): Promise<TicketEntity[]> {
    return Array.from(ticketsStore.values()).filter(t => t.bookingId === bookingId);
  },

  async getUnreconciledPayments(): Promise<PaymentAttemptEntity[]> {
    return Array.from(paymentsStore.values()).filter(p => p.status === 'UNKNOWN');
  },

  async getAdminTicketingQueue() {
    const allBookings = await bookingService.listBookings('admin', 'ADMIN');
    // Bookings that have a successful or reconciled payment but are not yet TICKETED
    const paidBookingIds = new Set(
      Array.from(paymentsStore.values())
        .filter(p => p.status === 'SUCCEEDED' || p.status === 'RECONCILED')
        .map(p => p.bookingId)
    );

    return allBookings.filter(b => paidBookingIds.has(b.id) && b.bookingStatus !== 'TICKETED');
  }
};
