/**
 * Standalone migration script: SQLite → PostgreSQL
 *
 * Usage:
 *   POSTGRES_HOST=localhost POSTGRES_DB=quizapp POSTGRES_USER=quizapp POSTGRES_PASSWORD=quizapp \
 *   npx tsx scripts/migrate-sqlite-to-postgres.ts [path-to-sqlite.db]
 *
 * The script:
 *   1. Opens the existing SQLite database via better-sqlite3
 *   2. Connects to PostgreSQL via Kysely
 *   3. Runs Kysely migrations on PG (creates schema)
 *   4. Copies data table by table in FK-safe order
 */

import dotenv from 'dotenv';
dotenv.config();

import Database from 'better-sqlite3';
import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import path from 'path';
import type { Database as DbSchema } from '../src/db/database.types';

// Table insertion order respecting FK constraints
const TABLE_ORDER = [
  'users',
  'email_verification_codes',
  'quizzes',
  'questions',
  'answers',
  'game_sessions',
  'players',
  'player_answers',
] as const;

async function main(): Promise<void> {
  const sqlitePath = process.argv[2] || process.env.DB_PATH || './data/quiz.db';
  const resolved = path.resolve(sqlitePath);

  console.log(`[migrate] Opening SQLite database: ${resolved}`);
  const sqlite = new Database(resolved, { readonly: true });

  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'quizapp',
    user: process.env.POSTGRES_USER || 'quizapp',
    password: process.env.POSTGRES_PASSWORD || 'quizapp',
  });

  const pg = new Kysely<DbSchema>({
    dialect: new PostgresDialect({ pool }),
  });

  console.log('[migrate] Connected to PostgreSQL');

  // Run migrations on PG to ensure schema exists
  const { Migrator, FileMigrationProvider } = await import('kysely');
  const { promises: fs } = await import('fs');

  const migrator = new Migrator({
    db: pg,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, '../src/db/migrations'),
    }),
  });

  const { error: migrationError } = await migrator.migrateToLatest();
  if (migrationError) {
    console.error('[migrate] Migration failed:', migrationError);
    process.exit(1);
  }
  console.log('[migrate] PostgreSQL schema ready');

  // Copy data table by table
  for (const table of TABLE_ORDER) {
    const rows = sqlite.prepare(`SELECT * FROM ${table}`).all() as Record<string, unknown>[];

    if (rows.length === 0) {
      console.log(`[migrate] ${table}: 0 rows (skipped)`);
      continue;
    }

    const columns = Object.keys(rows[0]);

    // Insert in batches of 100
    const BATCH_SIZE = 100;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await pg
        .insertInto(table as any)
        .values(batch as any)
        .onConflict((oc) => oc.column('id').doNothing())
        .execute();

      inserted += batch.length;
    }

    console.log(`[migrate] ${table}: ${inserted} rows copied`);
  }

  sqlite.close();
  await pg.destroy();

  console.log('[migrate] Migration complete!');
}

main().catch((err) => {
  console.error('[migrate] Fatal error:', err);
  process.exit(1);
});
