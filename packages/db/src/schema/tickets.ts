import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { bookings, bookingPassengers } from './bookings';
import { users } from './users';

export const ticketIssuanceMethodEnum = pgEnum('ticket_issuance_method', ['AUTOMATIC_SIMULATED', 'ADMIN_MANUAL']);
export const ticketIssuanceStatusEnum = pgEnum('ticket_issuance_status', ['ISSUED', 'VOIDED']);

export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  passengerId: uuid('passenger_id').notNull().references(() => bookingPassengers.id, { onDelete: 'cascade' }),
  ticketNumber: text('ticket_number').notNull().unique(), // e.g. 001-DEMO-XXXXXXXXXX
  issuanceMethod: ticketIssuanceMethodEnum('issuance_method').notNull().default('AUTOMATIC_SIMULATED'),
  issuanceStatus: ticketIssuanceStatusEnum('issuance_status').notNull().default('ISSUED'),
  issuedBy: uuid('issued_by').references(() => users.id),
  issuedAt: timestamp('issued_at', { withTimezone: true }).defaultNow().notNull()
});
