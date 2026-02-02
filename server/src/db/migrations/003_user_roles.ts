import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Add role column to users table
  await db.schema
    .alterTable('users')
    .addColumn('role', 'text', (col) => col.notNull().defaultTo('user'))
    .execute();

  // Add is_active column to users table
  await db.schema
    .alterTable('users')
    .addColumn('is_active', 'integer', (col) => col.notNull().defaultTo(1))
    .execute();

  // Add index for role
  await db.schema
    .createIndex('idx_users_role')
    .ifNotExists()
    .on('users')
    .column('role')
    .execute();

  // Add index for is_active
  await db.schema
    .createIndex('idx_users_is_active')
    .ifNotExists()
    .on('users')
    .column('is_active')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_users_is_active').ifExists().execute();
  await db.schema.dropIndex('idx_users_role').ifExists().execute();
  await db.schema.alterTable('users').dropColumn('is_active').execute();
  await db.schema.alterTable('users').dropColumn('role').execute();
}
