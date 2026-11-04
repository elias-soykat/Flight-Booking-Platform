import { AIRPORT_FIXTURES, AIRLINE_FIXTURES } from '@travel-platform/shared';
import { airports, airlines } from '../schema/flights';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export async function seedReferenceFixtures(db: PostgresJsDatabase<Record<string, never>>) {
  // Seed reference airports
  for (const apt of AIRPORT_FIXTURES) {
    await db.insert(airports).values({
      iataCode: apt.iataCode,
      name: apt.name,
      city: apt.city,
      country: apt.country
    }).onConflictDoNothing();
  }

  // Seed reference airlines
  for (const al of AIRLINE_FIXTURES) {
    await db.insert(airlines).values({
      code: al.code,
      name: al.name
    }).onConflictDoNothing();
  }
}

