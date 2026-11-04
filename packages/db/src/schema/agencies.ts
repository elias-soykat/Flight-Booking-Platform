import { pgTable, uuid, text, timestamp, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const agencyStatusEnum = pgEnum('agency_status', ['ACTIVE', 'SUSPENDED']);
export const agencyMembershipStatusEnum = pgEnum('agency_membership_status', ['ACTIVE', 'INACTIVE']);
export const agencyInvitationStatusEnum = pgEnum('agency_invitation_status', ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED']);

export const agencies = pgTable('agencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  ownerUserId: uuid('owner_user_id').notNull().references(() => users.id),
  status: agencyStatusEnum('status').notNull().default('ACTIVE'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

export const agencyMemberships = pgTable('agency_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  customerUserId: uuid('customer_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: agencyMembershipStatusEnum('status').notNull().default('ACTIVE'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => [
  uniqueIndex('idx_agency_memberships_active_customer')
    .on(table.customerUserId)
    .where(sql`status = 'ACTIVE'`)
]);

export const agencyInvitations = pgTable('agency_invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  agencyId: uuid('agency_id').notNull().references(() => agencies.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  invitationTokenHash: text('invitation_token_hash').notNull().unique(),
  status: agencyInvitationStatusEnum('status').notNull().default('PENDING'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

