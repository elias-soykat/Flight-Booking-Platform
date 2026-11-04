import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('Admin User & Agency Inspection Routes', () => {
  it('blocks non-admin users with 403 Forbidden', async () => {
    const res = await app.request('/api/v1/admin/users', {
      headers: {
        'x-demo-user-id': 'cust-1',
        'x-demo-role': 'CUSTOMER'
      }
    });
    expect(res.status).toBe(403);
  });

  it('allows administrator to list platform users and agencies', async () => {
    const adminHeaders = {
      'x-demo-user-id': 'admin-root',
      'x-demo-role': 'ADMIN'
    };

    // 1. Get users
    const usersRes = await app.request('/api/v1/admin/users', {
      headers: adminHeaders
    });
    expect(usersRes.status).toBe(200);
    const usersBody = await usersRes.json() as { success: boolean; data: unknown[] };
    expect(usersBody.success).toBe(true);
    expect(Array.isArray(usersBody.data)).toBe(true);

    // 2. Get agencies
    const agenciesRes = await app.request('/api/v1/admin/agencies', {
      headers: adminHeaders
    });
    expect(agenciesRes.status).toBe(200);
    const agenciesBody = await agenciesRes.json() as { success: boolean; data: unknown[] };
    expect(agenciesBody.success).toBe(true);
    expect(Array.isArray(agenciesBody.data)).toBe(true);
  });
});
