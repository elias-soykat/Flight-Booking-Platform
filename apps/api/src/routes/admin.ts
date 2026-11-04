import { Hono } from 'hono';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { identityService } from '../modules/identity/service';
import { agencyService } from '../modules/agency/service';
import { paymentService } from '../modules/payment/service';

export const adminRouter = new Hono<AppContext>();


// Require ADMIN role for all routes in this router
adminRouter.use('*', requireRole('ADMIN'));

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


