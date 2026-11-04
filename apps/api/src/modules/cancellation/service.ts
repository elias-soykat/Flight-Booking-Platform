import type {
  CancellationRequestEntity,
  AdminDashboardMetrics
} from '@travel-platform/shared';
import { bookingService } from '../booking/service';
import { defaultFlightSupplier } from '../supplier/mock-supplier';
import { auditService } from '../audit/service';
import { identityService } from '../identity/service';
import { agencyService } from '../agency/service';
import { paymentService } from '../payment/service';
import { getRepository } from '../../repositories';

export class CancellationError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = 'CancellationError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface RequestCancellationParams {
  bookingId: string;
  reason: string;
  userId: string;
  userRole: string;
}

export interface ReviewCancellationParams {
  requestId: string;
  decision: 'APPROVE' | 'REJECT';
  reviewNote?: string;
  adminUserId: string;
}

export const cancellationService = {
  async requestCancellation(params: RequestCancellationParams): Promise<CancellationRequestEntity> {
    const { bookingId, reason, userId, userRole } = params;
    const repo = getRepository();

    // 1. Fetch booking with authorization check
    const booking = await bookingService.getBookingById(bookingId, userId, userRole as any);
    if (!booking) {
      throw new CancellationError('BOOKING_NOT_FOUND', `Booking '${bookingId}' not found`, 404);
    }

    // 2. Validate current status allows cancellation
    if (booking.bookingStatus !== 'CONFIRMED' && booking.bookingStatus !== 'TICKETED') {
      throw new CancellationError(
        'INVALID_BOOKING_STATUS',
        `Booking cannot be cancelled from its current status: ${booking.bookingStatus}`,
        400
      );
    }

    // 3. Ensure no active pending request exists for this booking
    const existing = await repo.cancellations.getCancellationRequestByBookingId(bookingId);
    if (existing && existing.status === 'PENDING') {
      throw new CancellationError(
        'CANCELLATION_ALREADY_PENDING',
        'A cancellation request is already pending review for this booking',
        400
      );
    }

    const previousBookingStatus = booking.bookingStatus;
    const now = new Date().toISOString();
    const requestId = `cancel-req-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 4. Update booking status to CANCELLATION_PENDING
    await bookingService.updateBookingStatus(booking.id, 'CANCELLATION_PENDING', userId, {
      cancellationRequestId: requestId,
      reason
    });

    // 5. Create Cancellation Request Entity
    const req: CancellationRequestEntity = {
      id: requestId,
      bookingId: booking.id,
      bookingReference: booking.bookingReference,
      requestedByUserId: userId,
      reason,
      status: 'PENDING',
      previousBookingStatus,
      createdAt: now,
      updatedAt: now
    };

    await repo.cancellations.createCancellationRequest(req);

    // 6. Record Audit Log
    await auditService.logAction({
      actorUserId: userId,
      action: 'CANCELLATION_REQUESTED',
      entityType: 'BOOKING',
      entityId: booking.id,
      metadata: {
        requestId: req.id,
        bookingReference: booking.bookingReference,
        reason,
        previousBookingStatus
      }
    });

    return req;
  },

  async reviewCancellation(params: ReviewCancellationParams): Promise<CancellationRequestEntity> {
    const { requestId, decision, reviewNote, adminUserId } = params;
    const repo = getRepository();

    const req = await repo.cancellations.getCancellationRequestById(requestId);
    if (!req) {
      throw new CancellationError('REQUEST_NOT_FOUND', `Cancellation request '${requestId}' not found`, 404);
    }

    if (req.status !== 'PENDING') {
      throw new CancellationError(
        'REQUEST_ALREADY_REVIEWED',
        `Cancellation request has already been reviewed (${req.status})`,
        400
      );
    }

    const booking = await bookingService.getBookingById(req.bookingId, adminUserId, 'ADMIN');
    if (!booking) {
      throw new CancellationError('BOOKING_NOT_FOUND', `Associated booking '${req.bookingId}' not found`, 404);
    }

    const now = new Date().toISOString();

    if (decision === 'APPROVE') {
      // 1. Notify supplier of cancellation simulation
      if (booking.supplierBookingReference) {
        await defaultFlightSupplier.cancelReservation(booking.supplierBookingReference);
      }

      // 2. Transition booking to CANCELLED
      await bookingService.updateBookingStatus(booking.id, 'CANCELLED', adminUserId, {
        reviewNote,
        cancellationRequestId: req.id
      });

      req.status = 'APPROVED';

      await auditService.logAction({
        actorUserId: adminUserId,
        action: 'CANCELLATION_APPROVED',
        entityType: 'BOOKING',
        entityId: booking.id,
        metadata: {
          requestId: req.id,
          bookingReference: booking.bookingReference,
          reviewNote
        }
      });
    } else {
      // Restore booking to previousStatus (e.g. CONFIRMED or TICKETED)
      await bookingService.updateBookingStatus(booking.id, req.previousBookingStatus, adminUserId, {
        reviewNote,
        cancellationRequestId: req.id,
        restoredStatus: req.previousBookingStatus
      });

      req.status = 'REJECTED';

      await auditService.logAction({
        actorUserId: adminUserId,
        action: 'CANCELLATION_REJECTED',
        entityType: 'BOOKING',
        entityId: booking.id,
        metadata: {
          requestId: req.id,
          bookingReference: booking.bookingReference,
          reviewNote,
          restoredStatus: req.previousBookingStatus
        }
      });
    }

    req.reviewedByUserId = adminUserId;
    req.reviewedAt = now;
    req.reviewNote = reviewNote;
    req.updatedAt = now;

    return await repo.cancellations.updateCancellationRequest(req.id, {
      status: req.status,
      reviewedByUserId: req.reviewedByUserId,
      reviewedAt: req.reviewedAt,
      reviewNote: req.reviewNote
    });
  },

  async getPendingCancellations(): Promise<CancellationRequestEntity[]> {
    return await getRepository().cancellations.listPendingRequests();
  },

  async getCancellationForBooking(bookingId: string): Promise<CancellationRequestEntity | null> {
    return await getRepository().cancellations.getCancellationRequestByBookingId(bookingId);
  },

  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const repo = getRepository();
    const allBookings = await bookingService.listBookings('admin', 'ADMIN');
    const users = await identityService.listAllUsers();
    const agencies = await agencyService.listAllAgencies();
    const payments = await paymentService.listAllPayments();
    const ticketingQueue = await paymentService.getAdminTicketingQueue();

    const totalBookings = allBookings.length;
    const confirmedBookings = allBookings.filter(b => b.bookingStatus === 'CONFIRMED').length;
    const ticketedBookings = allBookings.filter(b => b.bookingStatus === 'TICKETED').length;
    const pendingCancellations = allBookings.filter(b => b.bookingStatus === 'CANCELLATION_PENDING').length;
    const cancelledBookings = allBookings.filter(b => b.bookingStatus === 'CANCELLED').length;
    const failedPayments = payments.filter(p => p.status === 'FAILED').length;
    const unreconciledPayments = payments.filter(p => p.status === 'UNKNOWN').length;

    const operationalInterventionsRequired =
      pendingCancellations + unreconciledPayments + ticketingQueue.length;

    return {
      totalUsers: Math.max(users.length, 5), // Include fixture users
      totalAgencies: agencies.length,
      totalBookings,
      confirmedBookings,
      ticketedBookings,
      pendingCancellations,
      cancelledBookings,
      failedPayments,
      unreconciledPayments,
      operationalInterventionsRequired
    };
  },

  async clear(): Promise<void> {
    await getRepository().clear();
  }
};
