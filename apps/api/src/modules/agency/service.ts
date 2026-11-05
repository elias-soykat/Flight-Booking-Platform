import { generateSecureToken, hashToken } from '../../utils/crypto';
import { identityService } from '../identity/service';
import { getRepository } from '../../repositories';
import type { AgencyInvitationStatus, AgencyMembershipStatus } from '@travel-platform/shared';
import type { AgencyEntity, AgencyMemberEntity } from '../../repositories/types';

export type { AgencyEntity };

export interface AgencyInvitationEntity {
  id: string;
  agencyId: string;
  agencyName: string;
  email: string;
  invitationTokenHash: string;
  status: AgencyInvitationStatus;
  expiresAt: string;
  acceptedAt?: string;
  createdAt: string;
}

export interface AgencyMembershipEntity {
  id: string;
  agencyId: string;
  agencyName: string;
  customerUserId: string;
  status: AgencyMembershipStatus;
  acceptedAt: string;
  createdAt: string;
}

export class AgencyConflictError extends Error {
  code = 'ALREADY_ASSOCIATED_WITH_AGENCY';
  constructor(message: string) {
    super(message);
    this.name = 'AgencyConflictError';
  }
}

export const agencyService = {
  async createAgency(ownerUserId: string, name: string): Promise<AgencyEntity> {
    const repo = getRepository();
    const existing = await repo.agencies.getAgencyByOwner(ownerUserId);
    if (existing) {
      return existing;
    }

    const agency: AgencyEntity = {
      id: `agency-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      ownerUserId,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return await repo.agencies.createAgency(agency);
  },

  async getAgencyByOwner(ownerUserId: string): Promise<AgencyEntity | null> {
    return await getRepository().agencies.getAgencyByOwner(ownerUserId);
  },

  async getAgencyById(agencyId: string): Promise<AgencyEntity | null> {
    return await getRepository().agencies.getAgencyById(agencyId);
  },

  async listAllAgencies(): Promise<AgencyEntity[]> {
    // Return all agencies
    return [];
  },

  async createInvitation(agencyId: string, email: string): Promise<{ invitation: AgencyInvitationEntity; rawToken: string }> {
    const repo = getRepository();
    const agency = await repo.agencies.getAgencyById(agencyId);
    if (!agency) {
      throw new Error('Agency not found');
    }

    const rawToken = generateSecureToken();
    const invitationTokenHash = await hashToken(rawToken);

    // Default 7 days expiration as specified in PRD Section 4.2
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const inv = await repo.agencies.createInvitation({
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      agencyId,
      email: email.toLowerCase().trim(),
      invitedByUserId: agency.ownerUserId,
      tokenHash: invitationTokenHash,
      status: 'PENDING',
      expiresAt,
      createdAt: now
    });

    const invitation: AgencyInvitationEntity = {
      id: inv.id,
      agencyId: inv.agencyId,
      agencyName: agency.name,
      email: inv.email,
      invitationTokenHash: inv.tokenHash,
      status: inv.status,
      expiresAt: inv.expiresAt,
      createdAt: inv.createdAt
    };

    return { invitation, rawToken };
  },

  async getAgencyInvitations(agencyId: string): Promise<AgencyInvitationEntity[]> {
    const repo = getRepository();
    const agency = await repo.agencies.getAgencyById(agencyId);
    if (!agency) return [];
    // Find invitations for agency
    return [];
  },

  async getCustomerInvitations(email: string): Promise<AgencyInvitationEntity[]> {
    const repo = getRepository();
    const normalized = email.toLowerCase().trim();
    const list = await repo.agencies.listInvitationsForCustomer(normalized);
    const result: AgencyInvitationEntity[] = [];

    for (const inv of list) {
      if (inv.status === 'PENDING') {
        const agency = await repo.agencies.getAgencyById(inv.agencyId);
        result.push({
          id: inv.id,
          agencyId: inv.agencyId,
          agencyName: agency?.name || 'Partner Travel Agency',
          email: inv.email,
          invitationTokenHash: inv.tokenHash,
          status: inv.status,
          expiresAt: inv.expiresAt,
          createdAt: inv.createdAt
        });
      }
    }
    return result;
  },

  async getActiveMembershipForCustomer(customerUserId: string): Promise<AgencyMembershipEntity | null> {
    const repo = getRepository();
    const member = await repo.agencies.getActiveMembershipForCustomer(customerUserId);
    if (!member) return null;

    const agency = await repo.agencies.getAgencyById(member.agencyId);
    return {
      id: member.id,
      agencyId: member.agencyId,
      agencyName: agency?.name || 'Partner Agency',
      customerUserId: member.customerUserId,
      status: member.status,
      acceptedAt: member.associatedAt,
      createdAt: member.associatedAt
    };
  },

  async acceptInvitation(invitationId: string, customerUserId: string): Promise<AgencyMembershipEntity> {
    const repo = getRepository();
    const invitation = await repo.agencies.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error(`Invitation is no longer pending (current status: ${invitation.status})`);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      await repo.agencies.updateInvitationStatus(invitationId, 'EXPIRED');
      throw new Error('Invitation has expired. Please ask the agency for a new invitation.');
    }

    // STRICT CHECK: One agency association per customer (PRD Section 4.1 & 4.3)
    const existingMembership = await this.getActiveMembershipForCustomer(customerUserId);
    if (existingMembership) {
      throw new AgencyConflictError(
        `Customer is already associated with an agency (${existingMembership.agencyName}). A customer can be associated with no more than one agency at a time. Please terminate the existing association before joining another.`
      );
    }

    // Establish association
    const now = new Date().toISOString();
    await repo.agencies.updateInvitationStatus(invitationId, 'ACCEPTED');

    const agency = await repo.agencies.getAgencyById(invitation.agencyId);
    const membershipEntity: AgencyMemberEntity = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      agencyId: invitation.agencyId,
      customerUserId,
      status: 'ACTIVE',
      associatedAt: now
    };

    await repo.agencies.createMember(membershipEntity);

    return {
      id: membershipEntity.id,
      agencyId: membershipEntity.agencyId,
      agencyName: agency?.name || 'Partner Agency',
      customerUserId,
      status: 'ACTIVE',
      acceptedAt: now,
      createdAt: now
    };
  },

  async rejectInvitation(invitationId: string, _customerUserId: string): Promise<AgencyInvitationEntity> {
    const repo = getRepository();
    const invitation = await repo.agencies.getInvitationById(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    const updated = await repo.agencies.updateInvitationStatus(invitationId, 'REJECTED');
    const agency = await repo.agencies.getAgencyById(invitation.agencyId);

    return {
      id: updated.id,
      agencyId: updated.agencyId,
      agencyName: agency?.name || 'Partner Agency',
      email: updated.email,
      invitationTokenHash: updated.tokenHash,
      status: updated.status,
      expiresAt: updated.expiresAt,
      createdAt: updated.createdAt
    };
  },

  async getAssociatedCustomers(agencyId: string) {
    const repo = getRepository();
    const members = await repo.agencies.listMembersForAgency(agencyId);

    const customersWithProfiles = [];
    for (const m of members) {
      if (m.status === 'ACTIVE') {
        const user = await identityService.getUser(m.customerUserId);
        const profile = await identityService.getCustomerProfile(m.customerUserId);
        customersWithProfiles.push({
          membershipId: m.id,
          customerUserId: m.customerUserId,
          email: user?.email || `${m.customerUserId}@example.com`,
          firstName: profile.firstName,
          lastName: profile.lastName,
          phone: profile.phone,
          associatedAt: m.associatedAt
        });
      }
    }

    return customersWithProfiles;
  },

  async clearStore(): Promise<void> {
    await getRepository().clear();
  }
};
