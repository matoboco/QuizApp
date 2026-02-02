import { Question, QuestionType } from './quiz';
import { ScoreBreakdown } from './scoring';

export type GameStatus = 'lobby' | 'starting' | 'question' | 'answers' | 'result' | 'leaderboard' | 'finished';

export interface GameSession {
  id: string;
  quizId: string;
  hostId: string;
  pin: string;
  status: GameStatus;
  currentQuestionIndex: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
  shareToken?: string;
}

export interface Player {
  id: string;
  sessionId: string;
  nickname: string;
  score: number;
  streak: number;
  isConnected: boolean;
  joinedAt: string;
}

export interface PlayerAnswer {
  id: string;
  playerId: string;
  sessionId: string;
  questionId: string;
  answerId: string | null;
  isCorrect: boolean;
  timeTaken: number;
  score: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
  streak: number;
  lastScoreBreakdown?: ScoreBreakdown;
}

export interface AnswerDistribution {
  answerId: string;
  answerText: string;
  count: number;
  isCorrect: boolean;
  orderIndex: number;
}

export interface GameState {
  session: GameSession;
  players: Player[];
  currentQuestion?: Question;
  leaderboard: LeaderboardEntry[];
  answerDistribution?: AnswerDistribution[];
  questionStartedAt?: number;
  totalQuestions: number;
}

export interface PlayerGameState {
  sessionId: string;
  pin: string;
  status: GameStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  player: Player;
  currentQuestion?: {
    id: string;
    text: string;
    description?: string;
    imageUrl?: string;
    questionType: QuestionType;
    requireAll: boolean;
    timeLimit: number;
    answers: { id: string; text: string; orderIndex: number }[];
  };
  questionStartedAt?: number;
  lastResult?: ScoreBreakdown;
  hasAnswered: boolean;
  leaderboard?: LeaderboardEntry[];
  finalRank?: number;
}
