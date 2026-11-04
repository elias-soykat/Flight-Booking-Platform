import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import './setup';
import App from '../src/App';
import { DemoBanner } from '../src/components/DemoBanner';

describe('Frontend Shell & Layout Components', () => {
  it('renders persistent DemoBanner with DEMO / MOCK badge', () => {
    render(<DemoBanner />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/\[DEMO \/ MOCK\]/);
    expect(alert).toHaveTextContent(/No Real Tickets or Payments/);
  });

  it('renders App shell with navigation links and platform title', () => {
    render(<App />);
    expect(screen.getByText('TravelHub')).toBeInTheDocument();
    expect(screen.getAllByText('Flights').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Agency Portal').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Admin Dashboard').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Flight-First Travel Booking Platform')).toBeInTheDocument();
  });
});
