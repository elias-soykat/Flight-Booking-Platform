import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { agencyService } from '../modules/agency/service';
import { CreateAgencySchema, InviteCustomerSchema } from '@travel-platform/shared';

export const agenciesRouter = new Hono<AppContext>();

// Create Agency organization
agenciesRouter.post(
  '/',
  requireRole('AGENCY_OWNER', 'ADMIN'),
  zValidator('json', CreateAgencySchema),
  async (c) => {
    const ownerUserId = c.get('userId')!;
    const { name } = c.req.valid('json');
    const agency = await agencyService.createAgency(ownerUserId, name);
    return c.json({
      success: true,
      data: agency
    }, 201);
  }
);

// Get current agency owner's agency
agenciesRouter.get(
  '/me',
  requireRole('AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const ownerUserId = c.get('userId')!;
    const agency = await agencyService.getAgencyByOwner(ownerUserId);
    if (!agency) {
      return c.json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No agency found for current user' }
      }, 404);
    }
    return c.json({
      success: true,
      data: agency
    });
  }
);

// Invite a customer to the agency
agenciesRouter.post(
  '/invitations',
  requireRole('AGENCY_OWNER', 'ADMIN'),
  zValidator('json', InviteCustomerSchema),
  async (c) => {
    const ownerUserId = c.get('userId')!;
    const agency = await agencyService.getAgencyByOwner(ownerUserId);
    if (!agency) {
      return c.json({
        success: false,
        error: { code: 'AGENCY_REQUIRED', message: 'Please create an agency first' }
      }, 400);
    }

    const { email } = c.req.valid('json');
    const { invitation, rawToken } = await agencyService.createInvitation(agency.id, email);

    return c.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        rawToken
      }
    }, 201);
  }
);

// List invitations sent by this agency
agenciesRouter.get(
  '/invitations',
  requireRole('AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const ownerUserId = c.get('userId')!;
    const agency = await agencyService.getAgencyByOwner(ownerUserId);
    if (!agency) {
      return c.json({ success: true, data: [] });
    }
    const invitations = await agencyService.getAgencyInvitations(agency.id);
    return c.json({
      success: true,
      data: invitations
    });
  }
);

// List customers associated with this agency
agenciesRouter.get(
  '/customers',
  requireRole('AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const ownerUserId = c.get('userId')!;
    const agency = await agencyService.getAgencyByOwner(ownerUserId);
    if (!agency) {
      return c.json({ success: true, data: [] });
    }
    const customers = await agencyService.getAssociatedCustomers(agency.id);
    return c.json({
      success: true,
      data: customers
    });
  }
);

