import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { identityService } from '../modules/identity/service';
import { agencyService, AgencyConflictError } from '../modules/agency/service';

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

// Customer lists invitations received
customersRouter.get(
  '/invitations',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const userId = c.get('userId')!;
    const user = await identityService.getOrCreateUser(userId);
    // Support demo override header or user email
    const email = c.req.header('x-demo-email') || user.email;
    const invitations = await agencyService.getCustomerInvitations(email);
    return c.json({
      success: true,
      data: invitations
    });
  }
);

// Customer accepts agency invitation
customersRouter.post(
  '/invitations/:id/accept',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const customerUserId = c.get('userId')!;
    const invitationId = c.req.param('id');

    try {
      const membership = await agencyService.acceptInvitation(invitationId, customerUserId);
      return c.json({
        success: true,
        data: {
          membershipId: membership.id,
          agencyId: membership.agencyId,
          agencyName: membership.agencyName,
          membershipStatus: membership.status,
          acceptedAt: membership.acceptedAt
        }
      });
    } catch (err: unknown) {
      if (err instanceof AgencyConflictError) {
        return c.json({
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        }, 409);
      }
      const message = err instanceof Error ? err.message : 'Failed to accept invitation';
      return c.json({
        success: false,
        error: { code: 'INVITATION_ERROR', message }
      }, 400);
    }
  }
);

// Customer rejects agency invitation
customersRouter.post(
  '/invitations/:id/reject',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const customerUserId = c.get('userId')!;
    const invitationId = c.req.param('id');
    const invitation = await agencyService.rejectInvitation(invitationId, customerUserId);
    return c.json({
      success: true,
      data: {
        id: invitation.id,
        status: invitation.status
      }
    });
  }
);
