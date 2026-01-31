import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from '../src/db/schema';
import { seedDatabase } from '../src/db/seed';
import { closeDb } from '../src/db/connection';

async function main(): Promise<void> {
  try {
    console.log('[seed] Initializing database...');
    initializeDatabase();
    console.log('[seed] Database initialized.');

    await seedDatabase();

    console.log('[seed] Done.');
  } catch (err) {
    console.error('[seed] Failed to seed database:', err);
    process.exit(1);
  } finally {
    closeDb();
  }
}

main();
