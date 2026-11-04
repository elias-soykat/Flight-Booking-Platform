import { pgTable, uuid, text, timestamp, numeric, integer, pgEnum } from 'drizzle-orm/pg-core';

export const cabinClassEnum = pgEnum('cabin_class', ['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST']);

export const airports = pgTable('airports', {
  id: uuid('id').primaryKey().defaultRandom(),
  iataCode: text('iata_code').notNull().unique(),
  name: text('name').notNull(),
  city: text('city').notNull(),
  country: text('country').notNull()
});

export const airlines = pgTable('airlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  name: text('name').notNull()
});

export const flightOffers = pgTable('flight_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id').notNull(),
  supplierOfferReference: text('supplier_offer_reference').notNull(),
  originAirportId: uuid('origin_airport_id').notNull().references(() => airports.id),
  destinationAirportId: uuid('destination_airport_id').notNull().references(() => airports.id),
  departureAt: timestamp('departure_at', { withTimezone: true }).notNull(),
  arrivalAt: timestamp('arrival_at', { withTimezone: true }).notNull(),
  baseFare: numeric('base_fare', { precision: 12, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  cabinClass: cabinClassEnum('cabin_class').notNull().default('ECONOMY'),
  inventorySource: text('inventory_source').notNull().default('MOCK'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const flightSegments = pgTable('flight_segments', {
  id: uuid('id').primaryKey().defaultRandom(),
  flightOfferId: uuid('flight_offer_id').notNull().references(() => flightOffers.id, { onDelete: 'cascade' }),
  airlineId: uuid('airline_id').notNull().references(() => airlines.id),
  flightNumber: text('flight_number').notNull(),
  originAirportId: uuid('origin_airport_id').notNull().references(() => airports.id),
  destinationAirportId: uuid('destination_airport_id').notNull().references(() => airports.id),
  departureAt: timestamp('departure_at', { withTimezone: true }).notNull(),
  arrivalAt: timestamp('arrival_at', { withTimezone: true }).notNull(),
  baggageAllowance: text('baggage_allowance').notNull().default('1x23kg'),
  segmentOrder: integer('segment_order').notNull().default(1)
});
