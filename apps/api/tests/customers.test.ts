import { describe, it, expect } from 'vitest';
import { app } from '../src/index';

describe('Identity & Customer Profile Routes', () => {
  it('GET /api/v1/auth/me returns 401 when unauthenticated', async () => {
    const res = await app.request('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/auth/me returns authenticated user identity', async () => {
    const res = await app.request('/api/v1/auth/me', {
      headers: {
        'x-demo-user-id': 'cust-uuid-1',
        'x-demo-role': 'CUSTOMER'
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; data: { id: string; role: string; email: string } };
    expect(body.success).toBe(true);
    expect(body.data.id).toBe('cust-uuid-1');
    expect(body.data.role).toBe('CUSTOMER');
  });

  it('GET & PATCH /api/v1/customers/me manages customer profile details', async () => {
    // 1. Get initial profile
    const getRes = await app.request('/api/v1/customers/me', {
      headers: {
        'x-demo-user-id': 'cust-uuid-1',
        'x-demo-role': 'CUSTOMER'
      }
    });
    expect(getRes.status).toBe(200);

    // 2. Update profile
    const patchRes = await app.request('/api/v1/customers/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-demo-user-id': 'cust-uuid-1',
        'x-demo-role': 'CUSTOMER'
      },
      body: JSON.stringify({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+15551234567'
      })
    });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json() as { success: boolean; data: { firstName: string; lastName: string; phone: string } };
    expect(patchBody.data.firstName).toBe('Jane');
    expect(patchBody.data.lastName).toBe('Doe');
    expect(patchBody.data.phone).toBe('+15551234567');
  });
});
