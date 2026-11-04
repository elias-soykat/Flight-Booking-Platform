import type { ErrorHandler } from 'hono';
import { ZodError } from 'zod';
import type { AppContext } from '../types/env';

export const errorHandler: ErrorHandler<AppContext> = (err, c) => {
  console.error('[API Error]:', err);

  if (err instanceof ZodError) {
    return c.json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors
      }
    }, 400);
  }

  const status = 'status' in err && typeof err.status === 'number' ? err.status : 500;
  const message = err.message || 'Internal Server Error';

  return c.json({
    success: false,
    error: {
      code: status === 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR',
      message
    }
  }, status as 500);
};
