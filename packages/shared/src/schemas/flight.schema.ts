import { z } from 'zod';

export const CabinClassEnum = z.enum(['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']);

export const FlightSearchQuerySchema = z.object({
  origin: z.string().length(3).regex(/^[A-Z]{3}$/, 'Origin must be a 3-letter uppercase IATA code'),
  destination: z.string().length(3).regex(/^[A-Z]{3}$/, 'Destination must be a 3-letter uppercase IATA code'),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be YYYY-MM-DD'),
  returnDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be YYYY-MM-DD').optional(),
  passengerCount: z.coerce.number().int().min(1, 'At least 1 passenger required').max(9, 'Maximum 9 passengers'),
  cabinClass: CabinClassEnum.default('ECONOMY')
}).refine(data => data.origin !== data.destination, {
  message: 'Origin and destination must be different',
  path: ['destination']
}).refine(data => {
  if (!data.returnDate) return true;
  return new Date(data.returnDate) >= new Date(data.departureDate);
}, {
  message: 'Return date must be on or after departure date',
  path: ['returnDate']
});

export type FlightSearchQuery = z.infer<typeof FlightSearchQuerySchema>;

