import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../types/env';
import type { UserRole } from '@travel-platform/shared';
import { authService } from '../modules/auth/service';

export const authMiddleware: MiddlewareHandler<AppContext> = async (c, next) => {
  const isProduction = c.env?.NODE_ENV === 'production';

  // 1. Check demo headers (ONLY in non-production environments)
  if (!isProduction) {
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
  }

  // 2. Check standard Authorization header (Bearer token)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    // In non-production test mode with mock tokens
    if (!isProduction && token.startsWith('demo-')) {
      const parts = token.split('-');
      c.set('userId', parts[1] || 'demo-user');
      c.set('userRole', (parts[2] as UserRole) || 'CUSTOMER');
      return next();
    }

    // Cryptographic JWT verification via authService
    try {
      const claims = await authService.verifyToken(token);
      if (claims) {
        c.set('userId', claims.sub);
        c.set('userRole', claims.role);
        if (claims.agencyId) {
          c.set('agencyId', claims.agencyId);
        }
        return next();
      } else {
        // Provided token was invalid or expired
        return c.json(
          {
            success: false,
            error: {
              code: 'INVALID_TOKEN',
              message: 'The provided Bearer token is invalid or expired'
            }
          },
          401
        );
      }
    } catch (e) {
      console.warn('Failed to verify token:', e);
      return c.json(
        {
          success: false,
          error: {
            code: 'INVALID_TOKEN',
            message: 'Failed to verify authentication token'
          }
        },
        401
      );
    }
  }

  return next();
};
