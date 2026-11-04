import { pgTable, uuid, text, timestamp, numeric, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { agencies } from './agencies';

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'TICKETED',
  'CANCELLATION_PENDING',
  'CANCELLED',
  'FAILED'
]);

export const passengerTypeEnum = pgEnum('passenger_type', ['ADULT', 'CHILD', 'INFANT']);

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingReference: text('booking_reference').notNull().unique(),
  customerUserId: uuid('customer_user_id').notNull().references(() => users.id),
  createdByUserId: uuid('created_by_user_id').notNull().references(() => users.id),
  agencyId: uuid('agency_id').references(() => agencies.id),
  supplierId: uuid('supplier_id').notNull(),
  inventorySource: text('inventory_source').notNull().default('MOCK'),
  supplierBookingReference: text('supplier_booking_reference'),
  pnr: text('pnr'),
  bookingStatus: bookingStatusEnum('booking_status').notNull().default('PENDING'),
  currency: text('currency').notNull().default('USD'),
  baseFare: numeric('base_fare', { precision: 12, scale: 2 }).notNull(),
  markupAmount: numeric('markup_amount', { precision: 12, scale: 2 }).notNull().default('0.00'),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const bookingPassengers = pgTable('booking_passengers', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  passengerType: passengerTypeEnum('passenger_type').notNull().default('ADULT'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: text('date_of_birth').notNull(),
  passportDetailsReference: text('passport_details_reference')
});

export const bookingEvents = pgTable('booking_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  previousStatus: text('previous_status'),
  newStatus: text('new_status').notNull(),
  actorUserId: uuid('actor_user_id').references(() => users.id),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});
