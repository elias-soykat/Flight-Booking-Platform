import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../types/env';
import { CreateBookingSchema } from '@travel-platform/shared';
import { requireRole } from '../middleware/rbac';
import { bookingService, BookingError } from '../modules/booking/service';
import { paymentService, PaymentError } from '../modules/payment/service';
import type { SimulationScenario } from '@travel-platform/shared';

export const bookingsRouter = new Hono<AppContext>();


// Create a new booking
bookingsRouter.post(
  '/',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  zValidator('json', CreateBookingSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid booking payload',
          details: result.error.errors
        }
      }, 400);
    }
    return undefined;
  }),
  async (c) => {
    const idempotencyKey = c.req.header('Idempotency-Key');
    if (!idempotencyKey || !idempotencyKey.trim()) {
      return c.json({
        success: false,
        error: {
          code: 'MISSING_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key header is required for booking creation'
        }
      }, 400);
    }

    const body = c.req.valid('json');
    const userId = c.get('userId')!;
    const userRole = c.get('userRole')!;

    try {
      const booking = await bookingService.createBooking({
        offerId: body.offerId,
        passengers: body.passengers,
        customerUserId: body.customerUserId,
        userId,
        userRole,
        idempotencyKey: idempotencyKey.trim()
      });

      return c.json({
        success: true,
        data: booking
      }, 201);
    } catch (err: unknown) {
      if (err instanceof BookingError) {
        return c.json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        }, err.statusCode as any);
      }
      const message = err instanceof Error ? err.message : 'Failed to create booking';
      return c.json({
        success: false,
        error: {
          code: 'BOOKING_CREATION_FAILED',
          message
        }
      }, 500);
    }
  }
);

// List bookings for authenticated user
bookingsRouter.get(
  '/',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const userId = c.get('userId')!;
    const userRole = c.get('userRole')!;

    const bookings = await bookingService.listBookings(userId, userRole);
    return c.json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  }
);

// Get booking details by ID
bookingsRouter.get(
  '/:bookingId',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const bookingId = c.req.param('bookingId');
    const userId = c.get('userId')!;
    const userRole = c.get('userRole')!;

    try {
      const booking = await bookingService.getBookingById(bookingId, userId, userRole);
      if (!booking) {
        return c.json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Booking '${bookingId}' not found`
          }
        }, 404);
      }

      return c.json({
        success: true,
        data: booking
      });
    } catch (err: unknown) {
      if (err instanceof BookingError) {
        return c.json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        }, err.statusCode as any);
      }
      const message = err instanceof Error ? err.message : 'Failed to retrieve booking';
      return c.json({
        success: false,
        error: {
          code: 'BOOKING_RETRIEVAL_FAILED',
          message
        }
      }, 500);
    }
  }
);

// Process simulated payment for a booking
bookingsRouter.post(
  '/:bookingId/payment',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const idempotencyKey = c.req.header('Idempotency-Key');
    if (!idempotencyKey || !idempotencyKey.trim()) {
      return c.json({
        success: false,
        error: {
          code: 'MISSING_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key header is required for payment processing'
        }
      }, 400);
    }

    const bookingId = c.req.param('bookingId');
    const userId = c.get('userId')!;
    const userRole = c.get('userRole')!;

    let scenario: SimulationScenario = 'SUCCESS';
    try {
      const body = await c.req.json().catch(() => ({}));
      if (body?.simulationScenario) {
        scenario = body.simulationScenario;
      }
    } catch {
      // Default to SUCCESS if no body provided
    }

    try {
      const result = await paymentService.processPayment({
        bookingId,
        scenario,
        idempotencyKey: idempotencyKey.trim(),
        userId,
        userRole
      });

      return c.json({
        success: true,
        data: result
      }, 201);
    } catch (err: unknown) {
      if (err instanceof PaymentError) {
        return c.json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        }, err.statusCode as any);
      }
      const message = err instanceof Error ? err.message : 'Payment processing failed';
      return c.json({
        success: false,
        error: {
          code: 'PAYMENT_FAILED',
          message
        }
      }, 500);
    }
  }
);

// Get payment attempts for a booking
bookingsRouter.get(
  '/:bookingId/payments',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const bookingId = c.req.param('bookingId');
    const payments = await paymentService.getPaymentsForBooking(bookingId);
    return c.json({
      success: true,
      count: payments.length,
      data: payments
    });
  }
);

// Get issued tickets for a booking
bookingsRouter.get(
  '/:bookingId/tickets',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const bookingId = c.req.param('bookingId');
    const tickets = await paymentService.getTicketsForBooking(bookingId);
    return c.json({
      success: true,
      count: tickets.length,
      data: tickets
    });
  }
);


