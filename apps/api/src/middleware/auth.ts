import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../types/env';
import type { UserRole } from '@travel-platform/shared';

export const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  // 1. Check demo headers first (crucial for $0 development & automated testing)
  const demoUserId = c.req.header('x-demo-user-id');
  const demoRole = c.req.header('x-demo-role') as UserRole | undefined;
  const demoAgencyId = c.req.header('x-demo-agency-id');

  if (demoUserId) {
    c.set('userId', demoUserId);
    c.set('userRole', demoRole || 'CUSTOMER');
    if (demoAgencyId) {
      c.set('agencyId', demoAgencyId);
    }
    return next();
  }

  // 2. Check standard Authorization header (Bearer token)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // In demo/test mode with mock tokens
    if (token.startsWith('demo-')) {
      const parts = token.split('-');
      c.set('userId', parts[1] || 'demo-user');
      c.set('userRole', (parts[2] as UserRole) || 'CUSTOMER');
      return next();
    }

    // In a live Supabase environment, parse claims
    try {
      // Decode JWT payload (payload is part 1 of 0.1.2)
      const base64Url = token.split('.')[1];
      if (base64Url) {
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload) as { sub?: string; role?: string; user_metadata?: { role?: UserRole } };

        if (payload.sub) {
          c.set('userId', payload.sub);
          const role = payload.user_metadata?.role || (payload.role === 'authenticated' ? 'CUSTOMER' : 'CUSTOMER');
          c.set('userRole', role as UserRole);
          return next();
        }
      }
    } catch (e) {
      console.warn('Failed to parse bearer token:', e);
    }
  }

  return next();
};
