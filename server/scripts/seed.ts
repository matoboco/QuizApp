import dotenv from 'dotenv';
dotenv.config();

import { runMigrations } from '../src/db/migrator';
import { seedDatabase } from '../src/db/seed';
import { closeDb } from '../src/db/connection';

async function main(): Promise<void> {
  try {
    console.log('[seed] Initializing database...');
    await runMigrations();
    console.log('[seed] Database initialized.');

    await seedDatabase();

    console.log('[seed] Done.');
  } catch (err) {
    console.error('[seed] Failed to seed database:', err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

main();
