import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  users: UsersTable;
  email_verification_codes: EmailVerificationCodesTable;
  quizzes: QuizzesTable;
  questions: QuestionsTable;
  answers: AnswersTable;
  game_sessions: GameSessionsTable;
  players: PlayersTable;
  player_answers: PlayerAnswersTable;
}

export interface UsersTable {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

export interface EmailVerificationCodesTable {
  id: string;
  user_id: string;
  email: string;
  code: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface QuizzesTable {
  id: string;
  title: string;
  description: string;
  host_id: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionsTable {
  id: string;
  quiz_id: string;
  text: string;
  image_url: string | null;
  question_type: string;
  require_all: number;
  time_limit: number;
  points: number;
  order_index: number;
  created_at: string;
}

export interface AnswersTable {
  id: string;
  question_id: string;
  text: string;
  is_correct: number;
  order_index: number;
}

export interface GameSessionsTable {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  status: string;
  current_question_index: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export interface PlayersTable {
  id: string;
  session_id: string;
  nickname: string;
  score: number;
  streak: number;
  is_connected: number;
  joined_at: string;
}

export interface PlayerAnswersTable {
  id: string;
  player_id: string;
  session_id: string;
  question_id: string;
  answer_id: string | null;
  is_correct: number;
  time_taken: number;
  score: number;
  created_at: string;
}
