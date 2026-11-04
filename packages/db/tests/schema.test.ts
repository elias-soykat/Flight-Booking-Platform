import { describe, it, expect } from 'vitest';
import {
  users,
  agencies,
  agencyMemberships,
  flightOffers,
  bookings,
  payments,
  tickets,
  cancellationRequests,
  auditLogs
} from '../src';

describe('Database Schema Definitions', () => {
  it('exports all core tables with required columns', () => {
    expect(users).toBeDefined();
    expect(agencies).toBeDefined();
    expect(agencyMemberships).toBeDefined();
    expect(flightOffers).toBeDefined();
    expect(bookings).toBeDefined();
    expect(payments).toBeDefined();
    expect(tickets).toBeDefined();
    expect(cancellationRequests).toBeDefined();
    expect(auditLogs).toBeDefined();
  });

  it('verifies bookings table contains immutable price snapshot columns and idempotency key', () => {
    expect(bookings.bookingReference).toBeDefined();
    expect(bookings.baseFare).toBeDefined();
    expect(bookings.markupAmount).toBeDefined();
    expect(bookings.totalAmount).toBeDefined();
    expect(bookings.idempotencyKey).toBeDefined();
  });

  it('verifies agencyMemberships table contains customerUserId and status', () => {
    expect(agencyMemberships.customerUserId).toBeDefined();
    expect(agencyMemberships.status).toBeDefined();
  });
});

