import { Hono } from 'hono';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { identityService } from '../modules/identity/service';
import { agencyService } from '../modules/agency/service';

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
