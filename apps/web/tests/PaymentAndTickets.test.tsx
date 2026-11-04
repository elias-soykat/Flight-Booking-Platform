import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import './setup';
import { PaymentModal } from '../src/components/PaymentModal';
import { TicketView } from '../src/components/TicketView';
import type { BookingEntity, TicketEntity } from '@travel-platform/shared';

const mockBooking: BookingEntity = {
  id: 'book-pay-test-1',
  bookingReference: 'BK-99AABB',
  customerUserId: 'cust-1',
  createdByUserId: 'cust-1',
  supplierId: 'mock-supplier-global',
  inventorySource: 'MOCK',
  supplierBookingReference: 'SIM-12345-99AABB',
  pnr: '7X9K2P',
  bookingStatus: 'CONFIRMED',
  currency: 'USD',
  baseFare: 450,
  markupAmount: 45,
  totalAmount: 495,
  idempotencyKey: 'idem-pay-test-1',
  createdAt: '2026-11-04T12:00:00Z',
  updatedAt: '2026-11-04T12:00:00Z',
  passengers: [
    {
      id: 'pax-1',
      passengerType: 'ADULT',
      firstName: 'Sarah',
      lastName: 'Connor',
      dateOfBirth: '1985-02-28',
      passportNumber: 'P98765432'
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
  events: []
};

const mockTickets: TicketEntity[] = [
  {
    id: 'tkt-1',
    bookingId: 'book-pay-test-1',
    passengerId: 'pax-1',
    passengerName: 'Sarah Connor',
    ticketNumber: '001-DEMO-8493021948',
    issuanceMethod: 'AUTOMATIC_SIMULATED',
    issuedAt: '2026-11-04T12:05:00Z'
  }
];

describe('PaymentModal Component', () => {
  it('renders total price and simulation scenarios, then triggers payment with selected scenario', () => {
    const handlePay = vi.fn();
    const handleClose = vi.fn();

    render(
      <PaymentModal
        booking={mockBooking}
        onPay={handlePay}
        onClose={handleClose}
      />
    );

    expect(screen.getByText(/\$495/i)).toBeInTheDocument();
    expect(screen.getByText(/Simulated Payment Processing/i)).toBeInTheDocument();

    // Select DECLINE scenario
    const declineRadio = screen.getByLabelText(/Decline/i);
    fireEvent.click(declineRadio);

    const submitBtn = screen.getByRole('button', { name: /authorize simulated payment/i });
    fireEvent.click(submitBtn);

    expect(handlePay).toHaveBeenCalledWith('DECLINE');
  });
});

describe('TicketView Component', () => {
  it('renders 13-digit mock ticket number, passenger name, and DEMO badge', () => {
    render(
      <TicketView
        booking={mockBooking}
        tickets={mockTickets}
      />
    );

    expect(screen.getByText('001-DEMO-8493021948')).toBeInTheDocument();
    expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    expect(screen.getByText('7X9K2P')).toBeInTheDocument();
    expect(screen.getByText(/AUTOMATIC_SIMULATED/i)).toBeInTheDocument();
    expect(screen.getByText(/\[DEMO \/ MOCK - NOT A VALID AIRLINE TICKET\]/i)).toBeInTheDocument();
  });
});

