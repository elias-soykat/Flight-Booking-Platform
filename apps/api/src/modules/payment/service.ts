import type {
  PaymentAttemptEntity,
  TicketEntity,
  SimulationScenario,
  UserRole
} from '@travel-platform/shared';
import { bookingService } from '../booking/service';
import { defaultFlightSupplier } from '../supplier/mock-supplier';
import { auditService } from '../audit/service';
import { getRepository } from '../../repositories';

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

export const paymentService = {
  async processPayment(params: ProcessPaymentParams): Promise<ProcessPaymentResult> {
    const { bookingId, scenario = 'SUCCESS', idempotencyKey, userId, userRole } = params;
    const repo = getRepository();

    // 1. Idempotency Check
    const cached = await repo.payments.getPaymentByIdempotencyKey(idempotencyKey);
    if (cached) {
      const tickets = await repo.tickets.getTicketsByBookingId(cached.bookingId);
      return { payment: cached, tickets };
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
          return {
            id: `tkt-${Date.now()}-${pax.id}`,
            bookingId: booking.id,
            passengerId: pax.id,
            passengerName: `${pax.firstName} ${pax.lastName}`,
            ticketNumber: tktNumber,
            issuanceMethod: 'AUTOMATIC_SIMULATED' as const,
            issuedAt: now
          };
        });

        // Update booking state to TICKETED
        await bookingService.updateBookingStatus(booking.id, 'TICKETED', userId, {
          paymentReference,
          ticketNumbers: tickets.map((t) => t.ticketNumber),
          issuanceMethod: 'AUTOMATIC_SIMULATED'
        });
      } else {
        // Payment succeeded but ticketing failed -> routes to admin ticketing queue
        await bookingService.updateBookingStatus(booking.id, 'CONFIRMED', userId, {
          paymentReference,
          ticketingFailure: issuance.failureReason || 'Supplier ticketing failed'
        });
      }
    } else if (scenario === 'DECLINE') {
      status = 'FAILED';
      failureReason = 'Payment declined by issuing bank (simulated)';
      // Booking remains in CONFIRMED state to allow retry
    } else if (scenario === 'TIMEOUT') {
      status = 'UNKNOWN';
      failureReason = 'Payment gateway timeout (simulated); status unknown pending reconciliation';
      // Route to admin reconciliation
    } else if (scenario === 'INSUFFICIENT_FUNDS') {
      status = 'FAILED';
      failureReason = 'Insufficient funds in customer account (simulated)';
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

    // Store payment and tickets in repository
    await repo.payments.createPayment(payment);
    if (tickets.length > 0) {
      await repo.tickets.createTickets(tickets);
    }

    return { payment, tickets };
  },

  async reconcilePayment(params: ReconcilePaymentParams): Promise<ProcessPaymentResult> {
    const { paymentId, action, note, adminUserId } = params;
    const repo = getRepository();

    const payment = await repo.payments.getPaymentById(paymentId);
    if (!payment) {
      throw new PaymentError('PAYMENT_NOT_FOUND', `Payment '${paymentId}' not found`, 404);
    }

    const booking = await bookingService.getBookingById(payment.bookingId, adminUserId, 'ADMIN');
    if (!booking) {
      throw new PaymentError('BOOKING_NOT_FOUND', `Associated booking '${payment.bookingId}' not found`, 404);
    }

    const now = new Date().toISOString();
    let tickets: TicketEntity[] = [];

    if (action === 'FORCE_SUCCESS') {
      payment.status = 'RECONCILED';
      payment.reconciledAt = now;
      payment.reconciliationNote = note;

      // Check if tickets already exist
      const existingTickets = await repo.tickets.getTicketsByBookingId(booking.id);
      if (existingTickets.length > 0) {
        tickets = existingTickets;
      } else {
        // Issue tickets via reconciliation
        tickets = booking.passengers.map((pax) => {
          return {
            id: `tkt-${Date.now()}-${pax.id}`,
            bookingId: booking.id,
            passengerId: pax.id,
            passengerName: `${pax.firstName} ${pax.lastName}`,
            ticketNumber: `001-DEMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            issuanceMethod: 'ADMIN_MANUAL' as const,
            issuedByUserId: adminUserId,
            issuedAt: now
          };
        });
        await repo.tickets.createTickets(tickets);
      }

      await bookingService.updateBookingStatus(booking.id, 'TICKETED', adminUserId, {
        reconciledBy: adminUserId,
        reconciliationNote: note,
        paymentReference: payment.paymentReference
      });
    } else {
      payment.status = 'FAILED';
      payment.failureReason = `Reconciled as failed by administrator: ${note}`;
    }

    await repo.payments.updatePayment(payment.id, {
      status: payment.status,
      failureReason: payment.failureReason,
      reconciledAt: payment.reconciledAt,
      reconciliationNote: payment.reconciliationNote
    });

    await auditService.logAction({
      actorUserId: adminUserId,
      action: 'PAYMENT_RECONCILED',
      entityType: 'PAYMENT',
      entityId: payment.id,
      metadata: {
        paymentId: payment.id,
        bookingId: payment.bookingId,
        action,
        note
      }
    });

    return { payment, tickets };
  },

  async issueTicketsManually(bookingId: string, adminUserId: string): Promise<TicketEntity[]> {
    const repo = getRepository();
    const booking = await bookingService.getBookingById(bookingId, adminUserId, 'ADMIN');
    if (!booking) {
      throw new PaymentError('BOOKING_NOT_FOUND', `Booking '${bookingId}' not found`, 404);
    }

    const now = new Date().toISOString();
    const tickets: TicketEntity[] = booking.passengers.map((pax) => {
      return {
        id: `tkt-${Date.now()}-${pax.id}`,
        bookingId: booking.id,
        passengerId: pax.id,
        passengerName: `${pax.firstName} ${pax.lastName}`,
        ticketNumber: `001-DEMO-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        issuanceMethod: 'ADMIN_MANUAL' as const,
        issuedByUserId: adminUserId,
        issuedAt: now
      };
    });

    await repo.tickets.createTickets(tickets);

    await bookingService.updateBookingStatus(booking.id, 'TICKETED', adminUserId, {
      manuallyIssuedBy: adminUserId,
      ticketNumbers: tickets.map((t) => t.ticketNumber)
    });

    await auditService.logAction({
      actorUserId: adminUserId,
      action: 'MANUAL_TICKET_ISSUANCE',
      entityType: 'BOOKING',
      entityId: bookingId,
      metadata: {
        ticketNumbers: tickets.map((t) => t.ticketNumber)
      }
    });

    return tickets;
  },

  async getPaymentsForBooking(bookingId: string): Promise<PaymentAttemptEntity[]> {
    return await getRepository().payments.listPaymentsForBooking(bookingId);
  },

  async getTicketsForBooking(bookingId: string): Promise<TicketEntity[]> {
    return await getRepository().tickets.getTicketsByBookingId(bookingId);
  },

  async listAllPayments(): Promise<PaymentAttemptEntity[]> {
    return await getRepository().payments.listAllPayments();
  },

  async getUnreconciledPayments(): Promise<PaymentAttemptEntity[]> {
    return await getRepository().payments.listUnreconciledPayments();
  },

  async getAdminTicketingQueue() {
    const repo = getRepository();
    const allBookings = await bookingService.listBookings('admin', 'ADMIN');
    const allPayments = await repo.payments.listAllPayments();

    const paidBookingIds = new Set(
      allPayments
        .filter((p) => p.status === 'SUCCEEDED' || p.status === 'RECONCILED')
        .map((p) => p.bookingId)
    );

    return allBookings.filter((b) => paidBookingIds.has(b.id) && b.bookingStatus !== 'TICKETED');
  },

  async clearStore(): Promise<void> {
    await getRepository().clear();
  }
};
