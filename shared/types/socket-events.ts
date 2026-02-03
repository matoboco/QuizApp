import { GameState, PlayerGameState, LeaderboardEntry, AnswerDistribution, GameStatus } from './game';
import { ScoreBreakdown } from './scoring';
import { QuestionType } from './quiz';

// Client -> Server events
export interface ClientToServerEvents {
  // Host events
  'host:start-game': (sessionId: string) => void;
  'host:next-question': (sessionId: string) => void;
  'host:show-answers': (sessionId: string) => void;
  'host:show-result': (sessionId: string) => void;
  'host:show-leaderboard': (sessionId: string) => void;
  'host:end-game': (sessionId: string) => void;
  'host:kick-player': (data: { sessionId: string; playerId: string }) => void;

  // Player events
  'player:join': (data: { pin: string; nickname: string }, callback: (response: { success: boolean; error?: string; playerId?: string; sessionId?: string; token?: string }) => void) => void;
  'player:submit-answer': (data: { sessionId: string; questionId: string; answerId: string | string[] }) => void;

  // Display events
  'display:attach': (data: { pin: string }, callback: (response: { success: boolean; error?: string; sessionId?: string; displayId?: string; token?: string }) => void) => void;

  // Common events
  'reconnect-game': (data: { sessionId: string; playerId?: string }) => void;
}

// Server -> Client events
export interface ServerToClientEvents {
  // Host events
  'game:state-update': (state: GameState) => void;
  'game:player-joined': (player: { id: string; nickname: string }) => void;
  'game:player-left': (playerId: string) => void;
  'game:player-reconnected': (player: { id: string; nickname: string }) => void;
  'game:player-answered': (data: { playerId: string; totalAnswered: number; totalPlayers: number }) => void;
  'game:answer-distribution': (distribution: AnswerDistribution[]) => void;
  'game:leaderboard': (leaderboard: LeaderboardEntry[]) => void;
  'game:finished': (leaderboard: LeaderboardEntry[]) => void;

  // Player events
  'player:state-update': (state: PlayerGameState) => void;
  'player:question': (data: { id: string; text: string; imageUrl?: string; questionType: QuestionType; requireAll: boolean; timeLimit: number; answers: { id: string; text: string; orderIndex: number }[]; questionIndex: number; totalQuestions: number }) => void;
  'player:answer-result': (result: ScoreBreakdown) => void;
  'player:game-status': (status: GameStatus) => void;
  'player:kicked': () => void;
  'player:game-finished': (data: { rank: number; totalScore: number; leaderboard: LeaderboardEntry[] }) => void;

  // Display events
  'display:count-update': (count: number) => void;

  // Common events
  'error': (message: string) => void;
  'game:countdown': (seconds: number) => void;
  'game:time-up': () => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  userId?: string;
  playerId?: string;
  displayId?: string;
  sessionId?: string;
  type: 'host' | 'player' | 'display';
}
