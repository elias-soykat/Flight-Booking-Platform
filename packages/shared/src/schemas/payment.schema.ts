import { z } from 'zod';

export const ProcessPaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking UUID'),
  simulationScenario: z.enum(['SUCCESS', 'DECLINE', 'TIMEOUT', 'INSUFFICIENT_FUNDS']).default('SUCCESS')
});

export const ReconcilePaymentSchema = z.object({
  paymentId: z.string().uuid('Invalid payment UUID'),
  action: z.enum(['FORCE_SUCCESS', 'FORCE_FAIL', 'RETRY']),
  note: z.string().min(5, 'Reconciliation note must be provided')
});

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;
export type ReconcilePaymentInput = z.infer<typeof ReconcilePaymentSchema>;
