import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as usersSchema from './schema/users';
import * as agenciesSchema from './schema/agencies';
import * as flightsSchema from './schema/flights';
import * as bookingsSchema from './schema/bookings';
import * as paymentsSchema from './schema/payments';
import * as ticketsSchema from './schema/tickets';
import * as auditSchema from './schema/audit';

export const schema = {
  ...usersSchema,
  ...agenciesSchema,
  ...flightsSchema,
  ...bookingsSchema,
  ...paymentsSchema,
  ...ticketsSchema,
  ...auditSchema
};

export type DatabaseSchema = typeof schema;

export function createDbClient(connectionString: string) {
  // Free tier Supabase / Postgres client
  const client = postgres(connectionString, { prepare: false });
  return drizzle(client, { schema });
}

export * from './schema/users';
export * from './schema/agencies';
export * from './schema/flights';
export * from './schema/bookings';
export * from './schema/payments';
export * from './schema/tickets';
export * from './schema/audit';
export * from './seeds/initial-fixtures';

