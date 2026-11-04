import { Hono } from 'hono';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { identityService } from '../modules/identity/service';

export const authRouter = new Hono<AppContext>();

authRouter.get(
  '/me',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const userId = c.get('userId')!;
    const role = c.get('userRole')!;
    const user = await identityService.getOrCreateUser(userId, role);
    const profile = await identityService.getCustomerProfile(userId);

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
        agencyId: c.get('agencyId'),
        profile
      }
    });
  }
);
