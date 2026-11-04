import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppContext } from './types/env';
import { errorHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health';
import { v1Router } from './routes/v1';

export const app = new Hono<AppContext>();

// Global middleware
app.use('*', logger());
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
}));

// Error handling
app.onError(errorHandler);

// Routes
app.route('/health', healthRouter);
app.route('/api/v1', v1Router);

// Fallback 404
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${c.req.method} ${c.req.path}`
    }
  }, 404);
});

export default app;
