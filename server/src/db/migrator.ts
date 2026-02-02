import { Migrator } from 'kysely';
import type { Migration, MigrationProvider } from 'kysely';
import { getKysely } from './connection';
import * as migration001 from './migrations/001_initial_schema';
import * as migration002 from './migrations/002_question_description';

/**
 * Inline migration provider that embeds migrations directly in the bundle.
 * This is needed because the production build uses esbuild to produce a
 * single JS file, so FileMigrationProvider cannot scan a directory at runtime.
 */
class InlineMigrationProvider implements MigrationProvider {
  async getMigrations(): Promise<Record<string, Migration>> {
    return {
      '001_initial_schema': migration001,
      '002_question_description': migration002,
    };
  }
}

export async function runMigrations(): Promise<void> {
  const db = getKysely();

  const migrator = new Migrator({
    db,
    provider: new InlineMigrationProvider(),
  });

  const { error, results } = await migrator.migrateToLatest();

  results?.forEach((it) => {
    if (it.status === 'Success') {
      console.log(`[migrator] Migration "${it.migrationName}" executed successfully`);
    } else if (it.status === 'Error') {
      console.error(`[migrator] Migration "${it.migrationName}" failed`);
    }
  });

  if (error) {
    console.error('[migrator] Failed to apply migrations:', error);
    throw error;
  }
}
