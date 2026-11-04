import type { IAppRepository } from './types';
import { MemoryRepository } from './memory-repository';
import { DrizzleRepository } from './drizzle-repository';

export * from './types';
export * from './memory-repository';
export * from './drizzle-repository';

let singletonMemoryRepo: MemoryRepository | null = null;
let singletonDrizzleRepo: DrizzleRepository | null = null;
let lastConnectionString: string | null = null;

export function getRepository(env?: { DATABASE_URL?: string }): IAppRepository {
  if (env?.DATABASE_URL) {
    if (!singletonDrizzleRepo || lastConnectionString !== env.DATABASE_URL) {
      singletonDrizzleRepo = new DrizzleRepository(env.DATABASE_URL);
      lastConnectionString = env.DATABASE_URL;
    }
    return singletonDrizzleRepo;
  }

  if (!singletonMemoryRepo) {
    singletonMemoryRepo = new MemoryRepository();
  }
  return singletonMemoryRepo;
}
