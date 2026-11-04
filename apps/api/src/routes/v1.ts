import { Hono } from 'hono';
import type { AppContext } from '../types/env';
import { MOCK_DEMO_NOTICE, DEFAULT_CURRENCY } from '@travel-platform/shared';
import { authRouter } from './auth';
import { customersRouter } from './customers';
import { agenciesRouter } from './agencies';
import { adminRouter } from './admin';
import { flightsRouter } from './flights';
import { bookingsRouter } from './bookings';
import { paymentsRouter } from './payments';

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
      auth: '/api/v1/auth',
      customers: '/api/v1/customers',
      flights: '/api/v1/flights',
      bookings: '/api/v1/bookings',
      payments: '/api/v1/payments',
      agencies: '/api/v1/agencies',
      admin: '/api/v1/admin'
    }
  });
});

v1Router.route('/auth', authRouter);
v1Router.route('/customers', customersRouter);
v1Router.route('/agencies', agenciesRouter);
v1Router.route('/admin', adminRouter);
v1Router.route('/flights', flightsRouter);
v1Router.route('/bookings', bookingsRouter);
v1Router.route('/payments', paymentsRouter);


