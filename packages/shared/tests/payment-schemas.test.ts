import { describe, it, expect } from 'vitest';
import { ProcessPaymentSchema, ReconcilePaymentSchema } from '../src/schemas/payment.schema';

describe('Payment & Reconciliation Schemas', () => {
  it('validates ProcessPaymentSchema with default simulationScenario', () => {
    const valid = ProcessPaymentSchema.parse({
      bookingId: 'book-12345'
    });

    expect(valid.bookingId).toBe('book-12345');
    expect(valid.simulationScenario).toBe('SUCCESS');
  });

  it('accepts explicit simulationScenario options', () => {
    const scenarios = ['SUCCESS', 'DECLINE', 'TIMEOUT', 'INSUFFICIENT_FUNDS'] as const;
    scenarios.forEach((scenario) => {
      const parsed = ProcessPaymentSchema.parse({
        bookingId: 'book-test',
        simulationScenario: scenario
      });
      expect(parsed.simulationScenario).toBe(scenario);
    });
  });

  it('rejects invalid simulation scenario', () => {
    expect(() =>
      ProcessPaymentSchema.parse({
        bookingId: 'book-test',
        simulationScenario: 'INVALID_SCENARIO'
      })
    ).toThrow();
  });

  it('validates ReconcilePaymentSchema', () => {
    const parsed = ReconcilePaymentSchema.parse({
      paymentId: 'pay-12345',
      action: 'FORCE_SUCCESS',
      note: 'Verified with mock payment log'
    });

    expect(parsed.action).toBe('FORCE_SUCCESS');
    expect(parsed.note).toBe('Verified with mock payment log');
  });

  it('rejects ReconcilePaymentSchema with short note', () => {
    expect(() =>
      ReconcilePaymentSchema.parse({
        paymentId: 'pay-12345',
        action: 'FORCE_SUCCESS',
        note: 'bad'
      })
    ).toThrow();
  });
});

