import { describe, it, expect } from 'vitest';
import {
  FlightSearchQuerySchema,
  CreateBookingSchema,
  ProcessPaymentSchema,
  MOCK_DEMO_NOTICE,
  AIRPORT_FIXTURES
} from '../src';

describe('Shared Domain Schemas & Constants', () => {
  it('validates a valid one-way flight search', () => {
    const valid = {
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-01',
      passengerCount: 2,
      cabinClass: 'ECONOMY'
    };
    const result = FlightSearchQuerySchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('rejects flight search when origin equals destination', () => {
    const invalid = {
      origin: 'JFK',
      destination: 'JFK',
      departureDate: '2026-12-01',
      passengerCount: 1
    };
    const result = FlightSearchQuerySchema.safeParse(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0]?.message).toContain('Origin and destination must be different');
    }
  });

  it('rejects flight search when return date is before departure date', () => {
    const invalid = {
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-10',
      returnDate: '2026-12-05',
      passengerCount: 1
    };
    const result = FlightSearchQuerySchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('validates booking creation with passenger details', () => {
    const valid = {
      offerId: 'mock-offer-123',
      passengers: [
        {
          passengerType: 'ADULT',
          firstName: 'Alice',
          lastName: 'Smith',
          dateOfBirth: '1990-05-15'
        }
      ]
    };
    const result = CreateBookingSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('validates simulated payment scenarios', () => {
    const valid = {
      bookingId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      simulationScenario: 'TIMEOUT'
    };
    const result = ProcessPaymentSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('includes demo notice and baseline airport fixtures', () => {
    expect(MOCK_DEMO_NOTICE).toContain('DEMO / MOCK');
    expect(AIRPORT_FIXTURES.length).toBeGreaterThan(0);
    expect(AIRPORT_FIXTURES.some(a => a.iataCode === 'JFK')).toBe(true);
  });
});

