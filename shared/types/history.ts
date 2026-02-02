export interface GameHistorySummary {
  id: string;
  pin: string;
  playerCount: number;
  startedAt: string;
  finishedAt: string;
}

export interface GameHistoryDetail {
  id: string;
  quiz: {
    id: string;
    title: string;
  };
  pin: string;
  startedAt: string;
  finishedAt: string;
  players: PlayerResult[];
  questions: GameQuestion[];
  shareToken: string | null;
}

export interface GameQuestion {
  id: string;
  text: string;
  questionIndex: number;
}

export interface PlayerResult {
  id: string;
  nickname: string;
  finalScore: number;
  finalRank: number;
  correctAnswers: number;
  totalAnswers: number;
  averageTime: number;
}

export interface QuestionStats {
  questionId: string;
  questionIndex: number;
  questionText: string;
  correctCount: number;
  totalAnswers: number;
  averageTime: number;
  answerDistribution: AnswerStat[];
}

export interface AnswerStat {
  answerId: string;
  text: string;
  count: number;
  isCorrect: boolean;
}

export interface RankingSnapshot {
  afterQuestionIndex: number;
  rankings: PlayerRanking[];
}

export interface PlayerRanking {
  playerId: string;
  nickname: string;
  score: number;
  rank: number;
}

export interface ShareTokenResponse {
  shareToken: string;
  shareUrl: string;
}
