// Schema initialization is now handled by Kysely migrations.
// See migrator.ts and migrations/ directory.
export { runMigrations as initializeDatabase } from './migrator';
