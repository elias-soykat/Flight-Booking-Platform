import { generateSecureToken, hashToken } from '../../utils/crypto';
import { identityService } from '../identity/service';
import type { AgencyStatus, AgencyInvitationStatus, AgencyMembershipStatus } from '@travel-platform/shared';

export interface AgencyEntity {
  id: string;
  name: string;
  ownerUserId: string;
  status: AgencyStatus;
  createdAt: string;
  updatedAt: string;
}

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

// In-memory agency stores for edge/test runtime
const agenciesStore = new Map<string, AgencyEntity>();
const invitationsStore = new Map<string, AgencyInvitationEntity>();
const membershipsStore = new Map<string, AgencyMembershipEntity>();

export class AgencyConflictError extends Error {
  code = 'ALREADY_ASSOCIATED_WITH_AGENCY';
  constructor(message: string) {
    super(message);
    this.name = 'AgencyConflictError';
  }
}

export const agencyService = {
  async createAgency(ownerUserId: string, name: string): Promise<AgencyEntity> {
    const existing = await this.getAgencyByOwner(ownerUserId);
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
    agenciesStore.set(agency.id, agency);
    return agency;
  },

  async getAgencyByOwner(ownerUserId: string): Promise<AgencyEntity | null> {
    for (const agency of agenciesStore.values()) {
      if (agency.ownerUserId === ownerUserId) return agency;
    }
    return null;
  },

  async getAgencyById(agencyId: string): Promise<AgencyEntity | null> {
    return agenciesStore.get(agencyId) || null;
  },

  async listAllAgencies(): Promise<AgencyEntity[]> {
    return Array.from(agenciesStore.values());
  },

  async createInvitation(agencyId: string, email: string): Promise<{ invitation: AgencyInvitationEntity; rawToken: string }> {
    const agency = await this.getAgencyById(agencyId);
    if (!agency) {
      throw new Error('Agency not found');
    }

    const rawToken = generateSecureToken();
    const invitationTokenHash = await hashToken(rawToken);

    // Default 7 days expiration as specified in PRD Section 4.2
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const invitation: AgencyInvitationEntity = {
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      agencyId,
      agencyName: agency.name,
      email: email.toLowerCase().trim(),
      invitationTokenHash,
      status: 'PENDING',
      expiresAt,
      createdAt: new Date().toISOString()
    };

    invitationsStore.set(invitation.id, invitation);
    return { invitation, rawToken };
  },

  async getAgencyInvitations(agencyId: string): Promise<AgencyInvitationEntity[]> {
    return Array.from(invitationsStore.values()).filter(inv => inv.agencyId === agencyId);
  },

  async getCustomerInvitations(email: string): Promise<AgencyInvitationEntity[]> {
    const normalized = email.toLowerCase().trim();
    return Array.from(invitationsStore.values()).filter(
      inv => inv.email === normalized && inv.status === 'PENDING'
    );
  },

  async getActiveMembershipForCustomer(customerUserId: string): Promise<AgencyMembershipEntity | null> {
    for (const membership of membershipsStore.values()) {
      if (membership.customerUserId === customerUserId && membership.status === 'ACTIVE') {
        return membership;
      }
    }
    return null;
  },

  async acceptInvitation(invitationId: string, customerUserId: string): Promise<AgencyMembershipEntity> {
    const invitation = invitationsStore.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new Error(`Invitation is no longer pending (current status: ${invitation.status})`);
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      invitation.status = 'EXPIRED';
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
    invitation.status = 'ACCEPTED';
    invitation.acceptedAt = now;

    const membership: AgencyMembershipEntity = {
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      agencyId: invitation.agencyId,
      agencyName: invitation.agencyName,
      customerUserId,
      status: 'ACTIVE',
      acceptedAt: now,
      createdAt: now
    };

    membershipsStore.set(membership.id, membership);
    return membership;
  },

  async rejectInvitation(invitationId: string, _customerUserId: string): Promise<AgencyInvitationEntity> {
    const invitation = invitationsStore.get(invitationId);
    if (!invitation) {
      throw new Error('Invitation not found');
    }
    invitation.status = 'REJECTED';
    return invitation;
  },

  async getAssociatedCustomers(agencyId: string) {
    const members = Array.from(membershipsStore.values()).filter(
      m => m.agencyId === agencyId && m.status === 'ACTIVE'
    );

    const customersWithProfiles = [];
    for (const m of members) {
      const user = await identityService.getUser(m.customerUserId);
      const profile = await identityService.getCustomerProfile(m.customerUserId);
      customersWithProfiles.push({
        membershipId: m.id,
        customerUserId: m.customerUserId,
        email: user?.email || `${m.customerUserId}@example.com`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        phone: profile.phone,
        associatedAt: m.acceptedAt
      });
    }

    return customersWithProfiles;
  }
};

