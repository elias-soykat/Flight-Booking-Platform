import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import './setup';
import { BookingConfirmation } from '../src/components/BookingConfirmation';
import { BookingsList } from '../src/components/BookingsList';
import type { BookingEntity } from '../../../apps/api/src/modules/booking/service';

const mockBooking: BookingEntity = {
  id: 'book-test-123',
  bookingReference: 'BK-7K2M9Q',
  customerUserId: 'user-cust-1',
  createdByUserId: 'user-cust-1',
  supplierId: 'mock-supplier-global',
  inventorySource: 'MOCK',
  supplierBookingReference: 'SIM-12345-7X9K2P',
  pnr: '7X9K2P',
  bookingStatus: 'CONFIRMED',
  currency: 'USD',
  baseFare: 450,
  markupAmount: 45,
  totalAmount: 495,
  idempotencyKey: 'idem-test-123',
  createdAt: '2026-11-04T12:00:00Z',
  updatedAt: '2026-11-04T12:00:00Z',
  passengers: [
    {
      id: 'pax-1',
      passengerType: 'ADULT',
      firstName: 'Alice',
      lastName: 'Wonderland',
      dateOfBirth: '1990-01-01',
      passportNumber: 'P12345678'
    }
  ],
  flightOffer: {
    id: 'off-test-1',
    supplierId: 'mock-supplier-global',
    supplierOfferReference: 'MOCK-JFK-LHR-1',
    originAirport: { id: '1', iataCode: 'JFK', name: 'JFK Intl', city: 'New York', country: 'USA' },
    destinationAirport: { id: '2', iataCode: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
    departureAt: '2026-12-25T08:00:00Z',
    arrivalAt: '2026-12-25T15:00:00Z',
    totalDurationMinutes: 420,
    stopCount: 0,
    cabinClass: 'ECONOMY',
    baseFare: 450,
    markupAmount: 45,
    totalAmount: 495,
    currency: 'USD',
    inventorySource: 'MOCK',
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
    segments: [
      {
        id: 'seg-1',
        flightNumber: 'BA-178',
        airline: { id: 'al-ba', code: 'BA', name: 'British Airways' },
        originAirport: { id: '1', iataCode: 'JFK', name: 'JFK Intl', city: 'New York', country: 'USA' },
        destinationAirport: { id: '2', iataCode: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
        departureAt: '2026-12-25T08:00:00Z',
        arrivalAt: '2026-12-25T15:00:00Z',
        durationMinutes: 420,
        baggageAllowance: '1x23kg'
      }
    ]
  },
  events: [
    {
      id: 'evt-1',
      eventType: 'BOOKING_CREATED',
      previousStatus: null,
      newStatus: 'CONFIRMED',
      createdAt: '2026-11-04T12:00:00Z'
    }
  ]
};

describe('Booking Confirmation & Bookings List UI', () => {
  it('renders booking confirmation card with reference, PNR, status, and DEMO badge', () => {
    render(
      <BookingConfirmation
        booking={mockBooking}
        onViewAllBookings={vi.fn()}
        onNewSearch={vi.fn()}
      />
    );

    expect(screen.getByText('BK-7K2M9Q')).toBeInTheDocument();
    expect(screen.getByText('7X9K2P')).toBeInTheDocument();
    expect(screen.getByText('CONFIRMED')).toBeInTheDocument();
    expect(screen.getByText(/Alice Wonderland/i)).toBeInTheDocument();
    expect(screen.getByText(/\$495 Total/i)).toBeInTheDocument();
    expect(screen.getByText(/\[DEMO \/ MOCK RESERVATION\]/i)).toBeInTheDocument();
  });

  it('renders bookings list with booking card items and details', () => {
    render(
      <BookingsList
        bookings={[mockBooking]}
        isLoading={false}
        onNewSearch={vi.fn()}
      />
    );

    expect(screen.getByText('BK-7K2M9Q')).toBeInTheDocument();
    expect(screen.getByText('7X9K2P')).toBeInTheDocument();
    expect(screen.getByText(/JFK → LHR/i)).toBeInTheDocument();
  });

  it('renders empty state when no bookings exist', () => {
    render(
      <BookingsList
        bookings={[]}
        isLoading={false}
        onNewSearch={vi.fn()}
      />
    );

    expect(screen.getByText(/No bookings found/i)).toBeInTheDocument();
  });
});
