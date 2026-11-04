import { pgTable, uuid, text, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { bookings } from './bookings';
import { users } from './users';

export const cancellationStatusEnum = pgEnum('cancellation_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const cancellationRequests = pgTable('cancellation_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  requestedBy: uuid('requested_by').notNull().references(() => users.id),
  reason: text('reason').notNull(),
  status: cancellationStatusEnum('status').notNull().default('PENDING'),
  reviewedBy: uuid('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

