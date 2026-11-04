import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import './setup';
import { BookingConfirmation } from '../src/components/BookingConfirmation';
import { BookingsList } from '../src/components/BookingsList';
import type { BookingEntity } from '@travel-platform/shared';

const baseBooking: BookingEntity = {
  id: 'book-fulfillment-test',
  bookingReference: 'BK-FLMT01',
  customerUserId: 'cust-1',
  createdByUserId: 'cust-1',
  supplierId: 'mock-supplier-global',
  inventorySource: 'MOCK',
  supplierBookingReference: 'SIM-FLMT01',
  pnr: '8Y3K9M',
  bookingStatus: 'CONFIRMED',
  currency: 'USD',
  baseFare: 450,
  markupAmount: 45,
  totalAmount: 495,
  idempotencyKey: 'idem-flmt-1',
  createdAt: '2026-11-04T12:00:00Z',
  updatedAt: '2026-11-04T12:00:00Z',
  passengers: [
    {
      id: 'pax-1',
      passengerType: 'ADULT',
      firstName: 'Ellen',
      lastName: 'Ripley',
      dateOfBirth: '1979-01-07'
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
    segments: []
  },
  events: []
};

describe('Admin Fulfillment & Booking Actions Integration', () => {
  it('renders "Pay Now" on confirmed booking and triggers payment modal', () => {
    const handlePayClick = vi.fn();
    render(
      <BookingConfirmation
        booking={baseBooking}
        onViewAllBookings={vi.fn()}
        onNewSearch={vi.fn()}
        onPayClick={handlePayClick}
      />
    );

    const payBtn = screen.getByRole('button', { name: /simulate payment/i });
    expect(payBtn).toBeInTheDocument();

    fireEvent.click(payBtn);
    expect(handlePayClick).toHaveBeenCalledTimes(1);
  });

  it('renders "View E-Tickets" when booking status is TICKETED', () => {
    const ticketedBooking: BookingEntity = {
      ...baseBooking,
      bookingStatus: 'TICKETED'
    };
    const handleViewTickets = vi.fn();

    render(
      <BookingConfirmation
        booking={ticketedBooking}
        onViewAllBookings={vi.fn()}
        onNewSearch={vi.fn()}
        onViewTickets={handleViewTickets}
      />
    );

    const ticketsBtn = screen.getByRole('button', { name: /view e-tickets/i });
    expect(ticketsBtn).toBeInTheDocument();

    fireEvent.click(ticketsBtn);
    expect(handleViewTickets).toHaveBeenCalledTimes(1);
  });

  it('renders "Pay Now" on confirmed booking in BookingsList', () => {
    const handlePayClick = vi.fn();
    render(
      <BookingsList
        bookings={[baseBooking]}
        isLoading={false}
        onPayClick={handlePayClick}
      />
    );

    const payBtn = screen.getByRole('button', { name: /pay now/i });
    expect(payBtn).toBeInTheDocument();

    fireEvent.click(payBtn);
    expect(handlePayClick).toHaveBeenCalledWith(baseBooking);
  });
});

