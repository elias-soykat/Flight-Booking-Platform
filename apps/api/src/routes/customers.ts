import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { identityService } from '../modules/identity/service';

const UpdateProfileSchema = z.object({
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: z.string().max(20).optional()
});

export const customersRouter = new Hono<AppContext>();

customersRouter.get(
  '/me',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const userId = c.get('userId')!;
    const profile = await identityService.getCustomerProfile(userId);
    return c.json({
      success: true,
      data: profile
    });
  }
);

customersRouter.patch(
  '/me',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  zValidator('json', UpdateProfileSchema),
  async (c) => {
    const userId = c.get('userId')!;
    const validated = c.req.valid('json');
    const updated = await identityService.updateCustomerProfile(userId, validated);
    return c.json({
      success: true,
      data: updated
    });
  }
);
