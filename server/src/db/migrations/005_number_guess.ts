import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('questions')
    .addColumn('correct_number', 'real')
    .execute();

  await db.schema
    .alterTable('questions')
    .addColumn('tolerance', 'real')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('questions').dropColumn('correct_number').execute();
  await db.schema.alterTable('questions').dropColumn('tolerance').execute();
}
