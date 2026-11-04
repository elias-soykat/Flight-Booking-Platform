import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import './setup';
import { FlightResults } from '../src/components/FlightResults';
import type { FlightOffer } from '@travel-platform/shared';

describe('FlightResults and FlightCard Component', () => {
  const mockOffer: FlightOffer = {
    id: 'off-jfk-lhr-1',
    supplierId: 'mock-supplier-global',
    supplierOfferReference: 'MOCK-JFK-LHR-20261201-1',
    originAirport: { id: 'apt-jfk', iataCode: 'JFK', name: 'JFK Airport', city: 'New York', country: 'USA' },
    destinationAirport: { id: 'apt-lhr', iataCode: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
    departureAt: '2026-12-01T08:00:00Z',
    arrivalAt: '2026-12-01T15:00:00Z',
    totalDurationMinutes: 420,
    stopCount: 0,
    segments: [
      {
        id: 'seg-1',
        flightNumber: 'BA-178',
        airline: { id: 'al-ba', code: 'BA', name: 'British Airways' },
        originAirport: { id: 'apt-jfk', iataCode: 'JFK', name: 'JFK Airport', city: 'New York', country: 'USA' },
        destinationAirport: { id: 'apt-lhr', iataCode: 'LHR', name: 'Heathrow Airport', city: 'London', country: 'UK' },
        departureAt: '2026-12-01T08:00:00Z',
        arrivalAt: '2026-12-01T15:00:00Z',
        durationMinutes: 420,
        baggageAllowance: '1x23kg'
      }
    ],
    cabinClass: 'ECONOMY',
    baseFare: 450,
    markupAmount: 45,
    totalAmount: 495,
    currency: 'USD',
    inventorySource: 'MOCK',
    expiresAt: '2026-12-01T23:59:59Z'
  };

  it('renders flight card with itinerary, price breakdown, and DEMO badge', () => {
    const handleSelect = vi.fn();
    render(
      <FlightResults
        offers={[mockOffer]}
        searchCriteria={{ origin: 'JFK', destination: 'LHR', departureDate: '2026-12-01', passengerCount: 1, cabinClass: 'ECONOMY' }}
        onSelectOffer={handleSelect}
      />
    );

    expect(screen.getByText('British Airways')).toBeInTheDocument();
    expect(screen.getByText('BA-178')).toBeInTheDocument();
    expect(screen.getByText('JFK')).toBeInTheDocument();
    expect(screen.getByText('LHR')).toBeInTheDocument();
    expect(screen.getByText('$495.00')).toBeInTheDocument();
    expect(screen.getAllByText(/DEMO \/ MOCK/i).length).toBeGreaterThanOrEqual(1);

    const selectBtn = screen.getByRole('button', { name: /select flight/i });
    expect(selectBtn).toBeInTheDocument();

    fireEvent.click(selectBtn);
    expect(handleSelect).toHaveBeenCalledWith(mockOffer);
  });

  it('renders meaningful empty state when no offers exist', () => {
    render(
      <FlightResults
        offers={[]}
        searchCriteria={{ origin: 'HND', destination: 'ORD', departureDate: '2026-12-01', passengerCount: 1, cabinClass: 'ECONOMY' }}
        onSelectOffer={vi.fn()}
      />
    );

    expect(screen.getByText(/No flights found for this route/i)).toBeInTheDocument();
  });
});
