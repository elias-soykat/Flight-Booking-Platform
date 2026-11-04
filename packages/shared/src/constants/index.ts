import type { Airport, Airline } from '../types';

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_MARKUP_PERCENTAGE = 0.10; // 10%
export const MOCK_INVENTORY_SOURCE = 'MOCK' as const;
export const MOCK_DEMO_NOTICE = 'DEMO / MOCK ENVIRONMENT - No Real Tickets or Payments';

export const AIRPORT_FIXTURES: Airport[] = [
  { id: 'apt-jfk', iataCode: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
  { id: 'apt-lhr', iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { id: 'apt-dxb', iataCode: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
  { id: 'apt-cdg', iataCode: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { id: 'apt-sin', iataCode: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { id: 'apt-hnd', iataCode: 'HND', name: 'Tokyo Haneda Airport', city: 'Tokyo', country: 'Japan' },
  { id: 'apt-sfo', iataCode: 'SFO', name: 'San Francisco International Airport', city: 'San Francisco', country: 'United States' },
  { id: 'apt-ord', iataCode: 'ORD', name: "O'Hare International Airport", city: 'Chicago', country: 'United States' }
];

export const AIRLINE_FIXTURES: Airline[] = [
  { id: 'al-aa', code: 'AA', name: 'American Airlines' },
  { id: 'al-ba', code: 'BA', name: 'British Airways' },
  { id: 'al-ek', code: 'EK', name: 'Emirates' },
  { id: 'al-af', code: 'AF', name: 'Air France' },
  { id: 'al-sq', code: 'SQ', name: 'Singapore Airlines' },
  { id: 'al-jl', code: 'JL', name: 'Japan Airlines' },
  { id: 'al-ua', code: 'UA', name: 'United Airlines' },
  { id: 'al-dl', code: 'DL', name: 'Delta Air Lines' }
];
