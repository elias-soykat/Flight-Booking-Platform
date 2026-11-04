import { Hono } from 'hono';
import type { AppContext } from '../types/env';

const serviceStartTime = Date.now();

export const healthRouter = new Hono<AppContext>();

healthRouter.get('/', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env?.ENVIRONMENT || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - serviceStartTime) / 1000)
  });
});
