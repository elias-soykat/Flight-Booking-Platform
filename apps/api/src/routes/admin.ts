import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { ReviewCancellationRequestSchema } from '@travel-platform/shared';
import { identityService } from '../modules/identity/service';
import { agencyService } from '../modules/agency/service';
import { paymentService } from '../modules/payment/service';
import { cancellationService, CancellationError } from '../modules/cancellation/service';
import { auditService } from '../modules/audit/service';

export const adminRouter = new Hono<AppContext>();

// Require ADMIN role for all routes in this router
adminRouter.use('*', requireRole('ADMIN'));

// Platform Metrics Dashboard
adminRouter.get('/dashboard', async (c) => {
  const metrics = await cancellationService.getDashboardMetrics();
  return c.json({
    success: true,
    data: metrics
  });
});

adminRouter.get('/users', async (c) => {
  const users = await identityService.listAllUsers();
  return c.json({
    success: true,
    data: users
  });
});

adminRouter.get('/agencies', async (c) => {
  const agencies = await agencyService.listAllAgencies();
  return c.json({
    success: true,
    data: agencies
  });
});

// Admin Ticketing Operations Queue
adminRouter.get('/ticketing-queue', async (c) => {
  const queue = await paymentService.getAdminTicketingQueue();
  return c.json({
    success: true,
    count: queue.length,
    data: queue
  });
});

// Admin Manual Ticket Issuance
adminRouter.post('/bookings/:bookingId/issue-tickets', async (c) => {
  const bookingId = c.req.param('bookingId');
  const adminUserId = c.get('userId')!;

  try {
    const tickets = await paymentService.issueTicketsManually(bookingId, adminUserId);
    return c.json({
      success: true,
      data: tickets
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to issue tickets manually';
    return c.json({
      success: false,
      error: {
        code: 'TICKET_ISSUANCE_FAILED',
        message
      }
    }, 400);
  }
});

// Admin Pending Cancellations Queue
adminRouter.get('/cancellations', async (c) => {
  const cancellations = await cancellationService.getPendingCancellations();
  return c.json({
    success: true,
    count: cancellations.length,
    data: cancellations
  });
});

// Admin Review Cancellation Request
adminRouter.post(
  '/cancellations/:id/review',
  zValidator('json', ReviewCancellationRequestSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cancellation review payload',
          details: result.error.errors
        }
      }, 400);
    }
    return undefined;
  }),
  async (c) => {
    const requestId = c.req.param('id');
    const body = c.req.valid('json');
    const adminUserId = c.get('userId')!;

    try {
      const reviewed = await cancellationService.reviewCancellation({
        requestId,
        decision: body.decision,
        reviewNote: body.reviewNote,
        adminUserId
      });

      return c.json({
        success: true,
        data: reviewed
      });
    } catch (err: unknown) {
      if (err instanceof CancellationError) {
        return c.json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        }, err.statusCode as any);
      }
      const message = err instanceof Error ? err.message : 'Failed to review cancellation request';
      return c.json({
        success: false,
        error: {
          code: 'CANCELLATION_REVIEW_FAILED',
          message
        }
      }, 500);
    }
  }
);

// Admin System Audit Logs
adminRouter.get('/audit-logs', async (c) => {
  const limitParam = c.req.query('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 50;
  const logs = await auditService.listLogs(limit);
  return c.json({
    success: true,
    count: logs.length,
    data: logs
  });
});
