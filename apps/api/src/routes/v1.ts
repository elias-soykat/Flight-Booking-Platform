import { Hono } from 'hono';
import type { AppContext } from '../types/env';
import { MOCK_DEMO_NOTICE, DEFAULT_CURRENCY } from '@travel-platform/shared';

export const v1Router = new Hono<AppContext>();

v1Router.get('/info', (c) => {
  return c.json({
    name: 'Travel Booking Platform API',
    version: '1.0.0',
    mode: 'MVP_MOCK',
    demoNotice: MOCK_DEMO_NOTICE,
    defaultCurrency: c.env?.PLATFORM_CURRENCY || DEFAULT_CURRENCY,
    endpoints: {
      health: '/health',
      flights: '/api/v1/flights',
      bookings: '/api/v1/bookings',
      payments: '/api/v1/payments',
      agencies: '/api/v1/agencies',
      admin: '/api/v1/admin'
    }
  });
});
