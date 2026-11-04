import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import './setup';
import { FlightSearchForm } from '../src/components/FlightSearchForm';

describe('FlightSearchForm Component', () => {
  it('renders search form inputs and submits valid criteria', () => {
    const handleSearch = vi.fn();
    render(<FlightSearchForm onSearch={handleSearch} />);

    expect(screen.getByText('One-way')).toBeInTheDocument();
    expect(screen.getByText('Round-trip')).toBeInTheDocument();
    expect(screen.getByLabelText(/From/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/To/i)).toBeInTheDocument();

    const searchBtn = screen.getByRole('button', { name: /search flights/i });
    expect(searchBtn).toBeInTheDocument();

    fireEvent.click(searchBtn);
    expect(handleSearch).toHaveBeenCalledTimes(1);
    expect(handleSearch).toHaveBeenCalledWith(expect.objectContaining({
      origin: 'JFK',
      destination: 'LHR',
      cabinClass: 'ECONOMY'
    }));
  });

  it('toggles return date input when selecting round-trip', () => {
    render(<FlightSearchForm onSearch={vi.fn()} />);

    const returnDateBefore = screen.queryByLabelText(/Return Date/i);
    expect(returnDateBefore).toBeDisabled();

    // Switch to round-trip
    fireEvent.click(screen.getByText('Round-trip'));
    const returnDateAfter = screen.getByLabelText(/Return Date/i);
    expect(returnDateAfter).not.toBeDisabled();
  });

  it('prevents submission and displays warning if origin equals destination', () => {
    const handleSearch = vi.fn();
    render(<FlightSearchForm onSearch={handleSearch} initialOrigin="JFK" initialDestination="JFK" />);

    const searchBtn = screen.getByRole('button', { name: /search flights/i });
    fireEvent.click(searchBtn);

    expect(screen.getByText(/Origin and destination must be different/i)).toBeInTheDocument();
    expect(handleSearch).not.toHaveBeenCalled();
  });
});
