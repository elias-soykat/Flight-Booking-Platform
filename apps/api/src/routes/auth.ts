import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { AppContext } from '../types/env';
import { requireRole } from '../middleware/rbac';
import { identityService } from '../modules/identity/service';
import { authService, AuthError } from '../modules/auth/service';

export const authRouter = new Hono<AppContext>();

const RegisterSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['CUSTOMER', 'AGENCY_OWNER', 'ADMIN']).default('CUSTOMER'),
  agencyName: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(1, 'Password is required')
});

authRouter.post('/register', zValidator('json', RegisterSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await authService.register(data);

    return c.json(
      {
        success: true,
        message: 'Registration successful',
        data: result
      },
      201
    );
  } catch (err: any) {
    if (err instanceof AuthError) {
      return c.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        },
        err.statusCode as any
      );
    }
    return c.json(
      {
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: err.message || 'An unexpected error occurred during registration'
        }
      },
      500
    );
  }
});

authRouter.post('/login', zValidator('json', LoginSchema), async (c) => {
  try {
    const data = c.req.valid('json');
    const result = await authService.login(data);

    return c.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (err: any) {
    if (err instanceof AuthError) {
      return c.json(
        {
          success: false,
          error: {
            code: err.code,
            message: err.message
          }
        },
        err.statusCode as any
      );
    }
    return c.json(
      {
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: err.message || 'An unexpected error occurred during login'
        }
      },
      500
    );
  }
});

authRouter.get(
  '/me',
  requireRole('CUSTOMER', 'AGENCY_OWNER', 'ADMIN'),
  async (c) => {
    const userId = c.get('userId')!;
    const role = c.get('userRole')!;
    const user = await identityService.getOrCreateUser(userId, role);
    const profile = await identityService.getCustomerProfile(userId);

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        agencyId: c.get('agencyId'),
        profile
      }
    });
  }
);
