import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import './setup';
import { PassengerForm } from '../src/components/PassengerForm';
import type { FlightOffer } from '@travel-platform/shared';

const mockOffer: FlightOffer = {
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
};

describe('PassengerForm Component', () => {
  it('renders passenger input fields and price snapshot', () => {
    render(
      <PassengerForm
        offer={mockOffer}
        userRole="CUSTOMER"
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByText(/Passenger 1/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByText(/\$495 Total/i)).toBeInTheDocument();
  });

  it('displays agency customer selector when user is AGENCY_OWNER', () => {
    const mockCustomers = [
      { customerUserId: 'cust-1', email: 'alice@test.com', firstName: 'Alice', lastName: 'Walker' },
      { customerUserId: 'cust-2', email: 'bob@test.com', firstName: 'Bob', lastName: 'Taylor' }
    ];

    render(
      <PassengerForm
        offer={mockOffer}
        userRole="AGENCY_OWNER"
        associatedCustomers={mockCustomers}
        onSubmit={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Book on behalf of Customer/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice Walker/i)).toBeInTheDocument();
  });

  it('validates fields and submits valid passenger details', () => {
    const handleSubmit = vi.fn();
    render(
      <PassengerForm
        offer={mockOffer}
        userRole="CUSTOMER"
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /confirm booking/i });

    // Fill form
    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'Emily' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Clark' } });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), { target: { value: '1993-07-19' } });

    fireEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    expect(handleSubmit).toHaveBeenCalledWith({
      customerUserId: undefined,
      passengers: [
        expect.objectContaining({
          firstName: 'Emily',
          lastName: 'Clark',
          dateOfBirth: '1993-07-19',
          passengerType: 'ADULT'
        })
      ]
    });
  });

  it('prevents submission when required fields are empty', () => {
    const handleSubmit = vi.fn();
    render(
      <PassengerForm
        offer={mockOffer}
        userRole="CUSTOMER"
        onSubmit={handleSubmit}
        onCancel={vi.fn()}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /confirm booking/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/First name is required/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
