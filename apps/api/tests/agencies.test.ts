import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('Agency Lifecycle & Customer Association', () => {
  const agencyOwnerHeaders = {
    'x-demo-user-id': 'owner-uuid-1',
    'x-demo-role': 'AGENCY_OWNER'
  };

  const customer1Headers = {
    'x-demo-user-id': 'customer-uuid-1',
    'x-demo-role': 'CUSTOMER'
  };

  const customer2Headers = {
    'x-demo-user-id': 'customer-uuid-2',
    'x-demo-role': 'CUSTOMER'
  };

  it('allows an agency owner to create an agency organization', async () => {
    const res = await app.request('/api/v1/agencies', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...agencyOwnerHeaders
      },
      body: JSON.stringify({ name: 'SkyHigh Travels' })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { success: boolean; data: { id: string; name: string; ownerUserId: string } };
    expect(body.success).toBe(true);
    expect(body.data.name).toBe('SkyHigh Travels');
    expect(body.data.ownerUserId).toBe('owner-uuid-1');
  });

  it('allows an agency owner to invite a customer by email with secure token', async () => {
    const res = await app.request('/api/v1/agencies/invitations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...agencyOwnerHeaders
      },
      body: JSON.stringify({ email: 'alice@traveler.com' })
    });

    expect(res.status).toBe(201);
    const body = await res.json() as { success: boolean; data: { id: string; email: string; rawToken: string; status: string } };
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('alice@traveler.com');
    expect(body.data.status).toBe('PENDING');
    expect(body.data.rawToken).toBeDefined();
    expect(body.data.rawToken.length).toBe(64);
  });

  it('allows customer to view invitation and accept it, establishing association', async () => {
    // 1. Customer lists pending invitations
    const listRes = await app.request('/api/v1/customers/invitations', {
      headers: {
        ...customer1Headers,
        'x-demo-email': 'alice@traveler.com'
      }
    });
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json() as { success: boolean; data: Array<{ id: string; email: string }> };
    expect(listBody.data.length).toBeGreaterThanOrEqual(1);
    const invitationId = listBody.data[0]!.id;

    // 2. Customer accepts invitation
    const acceptRes = await app.request(`/api/v1/customers/invitations/${invitationId}/accept`, {
      method: 'POST',
      headers: customer1Headers
    });
    expect(acceptRes.status).toBe(200);
    const acceptBody = await acceptRes.json() as { success: boolean; data: { membershipStatus: string; agencyName: string } };
    expect(acceptBody.success).toBe(true);
    expect(acceptBody.data.membershipStatus).toBe('ACTIVE');

    // 3. Agency owner now sees customer in associated customers list
    const custRes = await app.request('/api/v1/agencies/customers', {
      headers: agencyOwnerHeaders
    });
    expect(custRes.status).toBe(200);
    const custBody = await custRes.json() as { success: boolean; data: Array<{ customerUserId: string }> };
    expect(custBody.data.some(c => c.customerUserId === 'customer-uuid-1')).toBe(true);
  });

  it('prevents customer from accepting a second agency invitation (enforces 1-agency rule)', async () => {
    // Agency owner 2 creates agency and invites same customer
    const owner2Headers = {
      'x-demo-user-id': 'owner-uuid-2',
      'x-demo-role': 'AGENCY_OWNER'
    };
    await app.request('/api/v1/agencies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...owner2Headers },
      body: JSON.stringify({ name: 'Second Agency' })
    });

    const inviteRes = await app.request('/api/v1/agencies/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...owner2Headers },
      body: JSON.stringify({ email: 'alice@traveler.com' })
    });
    const inviteBody = await inviteRes.json() as { data: { id: string } };
    const secondInviteId = inviteBody.data.id;

    // Customer 1 tries to accept the second invitation
    const secondAcceptRes = await app.request(`/api/v1/customers/invitations/${secondInviteId}/accept`, {
      method: 'POST',
      headers: customer1Headers
    });

    expect(secondAcceptRes.status).toBe(409); // Conflict!
    const conflictBody = await secondAcceptRes.json() as { success: boolean; error: { code: string; message: string } };
    expect(conflictBody.success).toBe(false);
    expect(conflictBody.error.code).toBe('ALREADY_ASSOCIATED_WITH_AGENCY');
    expect(conflictBody.error.message).toContain('associated with no more than one agency');
  });

  it('allows customer to reject an invitation', async () => {
    // Invite customer 2
    const inviteRes = await app.request('/api/v1/agencies/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...agencyOwnerHeaders },
      body: JSON.stringify({ email: 'bob@traveler.com' })
    });
    const inviteBody = await inviteRes.json() as { data: { id: string } };

    // Customer 2 rejects invitation
    const rejectRes = await app.request(`/api/v1/customers/invitations/${inviteBody.data.id}/reject`, {
      method: 'POST',
      headers: customer2Headers
    });
    expect(rejectRes.status).toBe(200);
    const rejectBody = await rejectRes.json() as { success: boolean; data: { status: string } };
    expect(rejectBody.data.status).toBe('REJECTED');
  });
});

