import { describe, it, expect } from 'vitest';
import { MockFlightSupplier } from '../src/modules/supplier/mock-supplier';

describe('Deterministic MockFlightSupplier Engine', () => {
  const supplier = new MockFlightSupplier();

  it('returns deterministic flights for supported hub route (JFK -> LHR)', async () => {
    const criteria = {
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-01',
      passengerCount: 1,
      cabinClass: 'ECONOMY' as const
    };

    const results1 = await supplier.searchFlights(criteria);
    const results2 = await supplier.searchFlights(criteria);

    expect(results1.length).toBeGreaterThan(0);
    expect(results1.length).toBe(results2.length);

    // Deterministic check
    expect(results1[0]?.id).toBe(results2[0]?.id);
    expect(results1[0]?.totalAmount).toBe(results2[0]?.totalAmount);
    expect(results1[0]?.inventorySource).toBe('MOCK');
    expect(results1[0]?.originAirport.iataCode).toBe('JFK');
    expect(results1[0]?.destinationAirport.iataCode).toBe('LHR');
  });

  it('calculates customer total price with exact markup', async () => {
    const results = await supplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-01',
      passengerCount: 2,
      cabinClass: 'ECONOMY'
    });

    const offer = results[0]!;
    expect(offer.markupAmount).toBe(Math.round(offer.baseFare * 0.10 * 100) / 100);
    expect(offer.totalAmount).toBe(Math.round((offer.baseFare + offer.markupAmount) * 100) / 100);
  });

  it('returns empty results for route between identical airports or unsupported remote routes', async () => {
    const emptyResults = await supplier.searchFlights({
      origin: 'HND',
      destination: 'ORD',
      departureDate: '2026-12-01',
      passengerCount: 1,
      cabinClass: 'ECONOMY'
    });

    expect(Array.isArray(emptyResults)).toBe(true);
  });

  it('retrieves offer details by supplier reference', async () => {
    const results = await supplier.searchFlights({
      origin: 'LHR',
      destination: 'DXB',
      departureDate: '2026-12-05',
      passengerCount: 1,
      cabinClass: 'BUSINESS'
    });

    const offer = results[0]!;
    const fetched = await supplier.getOfferDetails(offer.supplierOfferReference);

    expect(fetched).not.toBeNull();
    expect(fetched?.supplierOfferReference).toBe(offer.supplierOfferReference);
    expect(fetched?.segments.length).toBeGreaterThanOrEqual(1);
  });

  it('validates fare and detects simulated price changes when configured', async () => {
    const results = await supplier.searchFlights({
      origin: 'JFK',
      destination: 'LHR',
      departureDate: '2026-12-01',
      passengerCount: 1,
      cabinClass: 'ECONOMY'
    });

    const offer = results[0]!;
    const validation = await supplier.validateFare(offer.supplierOfferReference, 1);
    expect(validation.valid).toBe(true);
    expect(validation.priceChanged).toBe(false);
  });
});
