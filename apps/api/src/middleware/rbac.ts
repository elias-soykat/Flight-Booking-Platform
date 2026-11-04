import type { MiddlewareHandler } from 'hono';
import type { AppContext } from '../types/env';
import type { UserRole } from '@travel-platform/shared';

export function requireRole(...allowedRoles: UserRole[]): MiddlewareHandler<AppContext> {
  return async (c, next) => {
    const userId = c.get('userId');
    const userRole = c.get('userRole');

    if (!userId) {
      return c.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        }
      }, 401);
    }

    if (!userRole || !allowedRoles.includes(userRole)) {
      return c.json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Forbidden: role '${userRole || 'ANONYMOUS'}' lacks required permissions`
        }
      }, 403);
    }

    return next();
  };
}

