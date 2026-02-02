import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add share_token column to game_sessions table for sharing game history
  await db.schema
    .alterTable('game_sessions')
    .addColumn('share_token', 'text')
    .execute();

  // Add unique index for share_token
  await db.schema
    .createIndex('idx_game_sessions_share_token')
    .ifNotExists()
    .on('game_sessions')
    .column('share_token')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_game_sessions_share_token').ifExists().execute();
  await db.schema.alterTable('game_sessions').dropColumn('share_token').execute();
}
