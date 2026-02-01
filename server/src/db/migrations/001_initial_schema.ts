import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // ---------- Tables ----------

  await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('email', 'text', (col) => col.notNull().unique())
    .addColumn('username', 'text', (col) => col.notNull().unique())
    .addColumn('password_hash', 'text', (col) => col.notNull())
    .addColumn('email_verified', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('email_verification_codes')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('user_id', 'text', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('email', 'text', (col) => col.notNull())
    .addColumn('code', 'text', (col) => col.notNull())
    .addColumn('expires_at', 'text', (col) => col.notNull())
    .addColumn('used_at', 'text')
    .addColumn('created_at', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('quizzes')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('title', 'text', (col) => col.notNull())
    .addColumn('description', 'text', (col) => col.notNull().defaultTo(''))
    .addColumn('host_id', 'text', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('is_published', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.notNull())
    .addColumn('updated_at', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('questions')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('quiz_id', 'text', (col) =>
      col.notNull().references('quizzes.id').onDelete('cascade')
    )
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('image_url', 'text')
    .addColumn('question_type', 'text', (col) =>
      col.notNull().defaultTo('multiple-choice')
    )
    .addColumn('require_all', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('time_limit', 'integer', (col) => col.notNull().defaultTo(20))
    .addColumn('points', 'integer', (col) => col.notNull().defaultTo(1000))
    .addColumn('order_index', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('answers')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('question_id', 'text', (col) =>
      col.notNull().references('questions.id').onDelete('cascade')
    )
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('is_correct', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('order_index', 'integer', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('game_sessions')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('quiz_id', 'text', (col) =>
      col.notNull().references('quizzes.id').onDelete('cascade')
    )
    .addColumn('host_id', 'text', (col) =>
      col.notNull().references('users.id')
    )
    .addColumn('pin', 'text', (col) => col.notNull().unique())
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('lobby'))
    .addColumn('current_question_index', 'integer', (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn('created_at', 'text', (col) => col.notNull())
    .addColumn('started_at', 'text')
    .addColumn('finished_at', 'text')
    .execute();

  await db.schema
    .createTable('players')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('session_id', 'text', (col) =>
      col.notNull().references('game_sessions.id').onDelete('cascade')
    )
    .addColumn('nickname', 'text', (col) => col.notNull())
    .addColumn('score', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('streak', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('is_connected', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('joined_at', 'text', (col) => col.notNull())
    .execute();

  await db.schema
    .createTable('player_answers')
    .ifNotExists()
    .addColumn('id', 'text', (col) => col.primaryKey())
    .addColumn('player_id', 'text', (col) =>
      col.notNull().references('players.id').onDelete('cascade')
    )
    .addColumn('session_id', 'text', (col) =>
      col.notNull().references('game_sessions.id').onDelete('cascade')
    )
    .addColumn('question_id', 'text', (col) =>
      col.notNull().references('questions.id').onDelete('cascade')
    )
    .addColumn('answer_id', 'text')
    .addColumn('is_correct', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('time_taken', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('score', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('created_at', 'text', (col) => col.notNull())
    .execute();

  // ---------- Indexes ----------

  await db.schema
    .createIndex('idx_quizzes_host_id')
    .ifNotExists()
    .on('quizzes')
    .column('host_id')
    .execute();

  await db.schema
    .createIndex('idx_questions_quiz_id')
    .ifNotExists()
    .on('questions')
    .column('quiz_id')
    .execute();

  await db.schema
    .createIndex('idx_questions_order')
    .ifNotExists()
    .on('questions')
    .columns(['quiz_id', 'order_index'])
    .execute();

  await db.schema
    .createIndex('idx_answers_question_id')
    .ifNotExists()
    .on('answers')
    .column('question_id')
    .execute();

  await db.schema
    .createIndex('idx_game_sessions_pin')
    .ifNotExists()
    .on('game_sessions')
    .column('pin')
    .execute();

  await db.schema
    .createIndex('idx_game_sessions_host_id')
    .ifNotExists()
    .on('game_sessions')
    .column('host_id')
    .execute();

  await db.schema
    .createIndex('idx_game_sessions_status')
    .ifNotExists()
    .on('game_sessions')
    .column('status')
    .execute();

  await db.schema
    .createIndex('idx_players_session_id')
    .ifNotExists()
    .on('players')
    .column('session_id')
    .execute();

  await db.schema
    .createIndex('idx_player_answers_player_id')
    .ifNotExists()
    .on('player_answers')
    .column('player_id')
    .execute();

  await db.schema
    .createIndex('idx_player_answers_session_question')
    .ifNotExists()
    .on('player_answers')
    .columns(['session_id', 'question_id'])
    .execute();

  await db.schema
    .createIndex('idx_player_answers_player_question')
    .ifNotExists()
    .on('player_answers')
    .columns(['player_id', 'question_id'])
    .execute();

  await db.schema
    .createIndex('idx_verification_codes_user_id')
    .ifNotExists()
    .on('email_verification_codes')
    .column('user_id')
    .execute();

  await db.schema
    .createIndex('idx_verification_codes_email')
    .ifNotExists()
    .on('email_verification_codes')
    .column('email')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('player_answers').ifExists().execute();
  await db.schema.dropTable('players').ifExists().execute();
  await db.schema.dropTable('game_sessions').ifExists().execute();
  await db.schema.dropTable('answers').ifExists().execute();
  await db.schema.dropTable('questions').ifExists().execute();
  await db.schema.dropTable('quizzes').ifExists().execute();
  await db.schema.dropTable('email_verification_codes').ifExists().execute();
  await db.schema.dropTable('users').ifExists().execute();
}
