import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CancellationModal } from '../src/components/CancellationModal';
import type { BookingEntity } from '@travel-platform/shared';

const mockBooking: BookingEntity = {
  id: 'book-test-modal-1',
  bookingReference: 'BK-TEST99',
  customerUserId: 'cust-1',
  createdByUserId: 'cust-1',
  supplierId: 'mock-supplier',
  inventorySource: 'MOCK',
  supplierBookingReference: 'SIM-12345',
  pnr: '7X9K2P',
  bookingStatus: 'CONFIRMED',
  currency: 'USD',
  baseFare: 450,
  markupAmount: 45,
  totalAmount: 495,
  idempotencyKey: 'idem-test',
  passengers: [
    {
      id: 'pax-1',
      passengerType: 'ADULT',
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1992-04-10'
    }
  ],
  flightOffer: {
    id: 'off-1',
    supplierId: 'mock-supplier',
    inventorySource: 'MOCK',
    supplierOfferReference: 'ref-1',
    airline: { code: 'BA', name: 'British Airways' },
    flightNumber: 'BA178',
    originAirport: { iataCode: 'JFK', name: 'JFK Intl', city: 'New York', country: 'USA' },
    destinationAirport: { iataCode: 'LHR', name: 'Heathrow', city: 'London', country: 'UK' },
    departureAt: '2026-12-15T08:00:00Z',
    arrivalAt: '2026-12-15T20:00:00Z',
    durationMinutes: 420,
    cabinClass: 'ECONOMY',
    seatsAvailable: 7,
    baseFare: 450,
    markupAmount: 45,
    totalAmount: 495,
    currency: 'USD',
    baggageAllowance: '1 x 23kg',
    cancellationPolicy: 'Refundable with fee'
  },
  events: [],
  createdAt: '2026-11-04T12:00:00Z',
  updatedAt: '2026-11-04T12:00:00Z'
};

describe('CancellationModal Component', () => {
  it('renders modal with DEMO badge and booking details when open', () => {
    render(
      <CancellationModal
        booking={mockBooking}
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText(/Request Flight Cancellation/i)).toBeInTheDocument();
    expect(screen.getByText(/\[DEMO \/ MOCK CANCELLATION REQUEST\]/i)).toBeInTheDocument();
    expect(screen.getByText('BK-TEST99')).toBeInTheDocument();
    expect(screen.getByText('7X9K2P')).toBeInTheDocument();
  });

  it('enforces minimum 5 characters reason before enabling submit', () => {
    const handleSubmit = vi.fn();
    render(
      <CancellationModal
        booking={mockBooking}
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Submit Cancellation Request/i });
    expect(submitBtn).toBeDisabled();

    const textarea = screen.getByPlaceholderText(/Reason for cancellation/i);
    fireEvent.change(textarea, { target: { value: 'nope' } });
    expect(submitBtn).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'Schedule conflicts due to urgent work' } });
    expect(submitBtn).not.toBeDisabled();
  });

  it('calls onSubmit with bookingId and entered reason', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <CancellationModal
        booking={mockBooking}
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    const textarea = screen.getByPlaceholderText(/Reason for cancellation/i);
    fireEvent.change(textarea, { target: { value: 'Schedule conflicts due to urgent work' } });

    const submitBtn = screen.getByRole('button', { name: /Submit Cancellation Request/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith(
        mockBooking.id,
        'Schedule conflicts due to urgent work'
      );
    });
  });
});
