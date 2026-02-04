import { Kysely, SqliteDialect, PostgresDialect } from 'kysely';
import type { Database } from './database.types';
import { config } from '../config';
import path from 'path';
import fs from 'fs';

let db: Kysely<Database> | null = null;

export function getKysely(): Kysely<Database> {
  if (db) {
    return db;
  }

  if (config.dbType === 'postgres') {
    // Dynamic import of pg is not ideal at top level, so we require it
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Pool } = require('pg');

    const pool = new Pool({
      host: config.postgres.host,
      port: config.postgres.port,
      database: config.postgres.database,
      user: config.postgres.user,
      password: config.postgres.password,
      max: config.postgres.poolMax,
    });

    db = new Kysely<Database>({
      dialect: new PostgresDialect({ pool }),
    });
  } else {
    // SQLite dialect
    const BetterSqlite3 = require('better-sqlite3');

    const dbPath = config.dbPath;
    const resolvedPath = path.resolve(dbPath);
    const dir = path.dirname(resolvedPath);

    // Auto-create data directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const sqliteDb = new BetterSqlite3(resolvedPath);

    // Enable WAL mode for better concurrent read performance
    sqliteDb.pragma('journal_mode = WAL');

    // Enable foreign keys
    sqliteDb.pragma('foreign_keys = ON');

    db = new Kysely<Database>({
      dialect: new SqliteDialect({ database: sqliteDb }),
    });
  }

  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
    db = null;
  }
}
