import { getDb } from './connection';

export function initializeDatabase(): void {
  const db = getDb();

  // Enable foreign keys (also done in connection, but ensure it's on)
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      host_id TEXT NOT NULL,
      is_published INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      text TEXT NOT NULL,
      image_url TEXT,
      time_limit INTEGER NOT NULL DEFAULT 20,
      points INTEGER NOT NULL DEFAULT 1000,
      order_index INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS answers (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      order_index INTEGER NOT NULL,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      host_id TEXT NOT NULL,
      pin TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'lobby',
      current_question_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      started_at TEXT,
      finished_at TEXT,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id),
      FOREIGN KEY (host_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      nickname TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      streak INTEGER NOT NULL DEFAULT 0,
      is_connected INTEGER NOT NULL DEFAULT 1,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_answers (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer_id TEXT,
      is_correct INTEGER NOT NULL DEFAULT 0,
      time_taken INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
      FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    -- Indices for frequently queried columns
    CREATE INDEX IF NOT EXISTS idx_quizzes_host_id ON quizzes(host_id);
    CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_pin ON game_sessions(pin);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_host_id ON game_sessions(host_id);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_players_session_id ON players(session_id);
    CREATE INDEX IF NOT EXISTS idx_player_answers_player_id ON player_answers(player_id);
    CREATE INDEX IF NOT EXISTS idx_player_answers_session_question ON player_answers(session_id, question_id);
    CREATE INDEX IF NOT EXISTS idx_player_answers_player_question ON player_answers(player_id, question_id);
  `);
}
