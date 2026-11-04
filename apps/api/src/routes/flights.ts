import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { AppContext } from '../types/env';
import { AIRPORT_FIXTURES, FlightSearchQuerySchema } from '@travel-platform/shared';
import { defaultFlightSupplier } from '../modules/supplier/mock-supplier';

export const flightsRouter = new Hono<AppContext>();
const defaultSupplier = defaultFlightSupplier;


// List available reference airports
flightsRouter.get('/airports', (c) => {
  return c.json({
    success: true,
    data: AIRPORT_FIXTURES
  });
});

// Search flights with criteria validation
flightsRouter.get(
  '/search',
  zValidator('query', FlightSearchQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid flight search parameters',
          details: result.error.errors
        }
      }, 400);
    }
    return undefined;
  }),
  async (c) => {
    const query = c.req.valid('query');
    const offers = await defaultSupplier.searchFlights({
      origin: query.origin,
      destination: query.destination,
      departureDate: query.departureDate,
      returnDate: query.returnDate,
      passengerCount: query.passengerCount,
      cabinClass: query.cabinClass
    });

    return c.json({
      success: true,
      count: offers.length,
      data: offers
    });
  }
);

// Get flight offer details
flightsRouter.get('/:offerId', async (c) => {
  const offerId = c.req.param('offerId');
  const offer = await defaultSupplier.getOfferDetails(offerId);

  if (!offer) {
    return c.json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Flight offer '${offerId}' not found or has expired`
      }
    }, 404);
  }

  return c.json({
    success: true,
    data: offer
  });
});
