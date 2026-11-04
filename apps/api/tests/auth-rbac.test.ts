import { describe, it, expect } from 'vitest';
import { Hono } from 'hono';
import { hashToken, generateSecureToken } from '../src/utils/crypto';
import { authMiddleware } from '../src/middleware/auth';
import { requireRole } from '../src/middleware/rbac';
import type { AppContext } from '../src/types/env';

describe('Auth & RBAC Middleware & Token Crypto', () => {
  it('generates secure random hex tokens and hashes them deterministically with SHA-256', async () => {
    const rawToken = generateSecureToken();
    expect(rawToken).toHaveLength(64); // 32 bytes hex = 64 chars

    const hash1 = await hashToken(rawToken);
    const hash2 = await hashToken(rawToken);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(rawToken);
  });

  it('authenticates user via x-demo-user-id and x-demo-role headers', async () => {
    const testApp = new Hono<AppContext>();
    testApp.use('*', authMiddleware);
    testApp.get('/test-auth', (c) => {
      return c.json({
        userId: c.get('userId'),
        userRole: c.get('userRole'),
        agencyId: c.get('agencyId')
      });
    });

    const res = await testApp.request('/test-auth', {
      headers: {
        'x-demo-user-id': 'user-123',
        'x-demo-role': 'AGENCY_OWNER',
        'x-demo-agency-id': 'agency-456'
      }
    });

    expect(res.status).toBe(200);
    const body = await res.json() as { userId: string; userRole: string; agencyId: string };
    expect(body.userId).toBe('user-123');
    expect(body.userRole).toBe('AGENCY_OWNER');
    expect(body.agencyId).toBe('agency-456');
  });

  it('defaults unauthenticated requests to anonymous / 401 when role guard is active', async () => {
    const testApp = new Hono<AppContext>();
    testApp.use('*', authMiddleware);
    testApp.get('/protected', requireRole('ADMIN'), (c) => c.text('admin only'));

    // Without auth
    const resNoAuth = await testApp.request('/protected');
    expect(resNoAuth.status).toBe(401);

    // With wrong role (CUSTOMER)
    const resCustomer = await testApp.request('/protected', {
      headers: {
        'x-demo-user-id': 'cust-1',
        'x-demo-role': 'CUSTOMER'
      }
    });
    expect(resCustomer.status).toBe(403);

    // With correct role (ADMIN)
    const resAdmin = await testApp.request('/protected', {
      headers: {
        'x-demo-user-id': 'admin-1',
        'x-demo-role': 'ADMIN'
      }
    });
    expect(resAdmin.status).toBe(200);
  });
});
