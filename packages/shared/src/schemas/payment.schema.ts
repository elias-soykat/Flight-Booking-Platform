import { z } from 'zod';

export const ProcessPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  simulationScenario: z.enum(['SUCCESS', 'DECLINE', 'TIMEOUT', 'INSUFFICIENT_FUNDS']).default('SUCCESS')
});

export const ReconcilePaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  action: z.enum(['FORCE_SUCCESS', 'FORCE_FAIL', 'RETRY']),
  note: z.string().min(5, 'Reconciliation note must be provided')
});

export type ProcessPaymentInput = z.infer<typeof ProcessPaymentSchema>;
export type ReconcilePaymentInput = z.infer<typeof ReconcilePaymentSchema>;
