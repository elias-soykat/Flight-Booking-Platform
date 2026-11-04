import { pgTable, uuid, text, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'UNKNOWN',
  'RECONCILED'
]);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  paymentReference: text('payment_reference').notNull().unique(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  paymentStatus: paymentStatusEnum('payment_status').notNull().default('PENDING'),
  providerType: text('provider_type').notNull().default('SIMULATED'),
  gatewayTransactionId: text('gateway_transaction_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const paymentAttempts = pgTable('payment_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id').notNull().references(() => payments.id, { onDelete: 'cascade' }),
  attemptNumber: integer('attempt_number').notNull().default(1),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  result: text('result').notNull(),
  failureReason: text('failure_reason'),
  reconciliationStatus: text('reconciliation_status'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

