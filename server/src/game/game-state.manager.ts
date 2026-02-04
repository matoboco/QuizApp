import {
  GameState,
  GameSession,
  GameStatus,
  Player,
  LeaderboardEntry,
  AnswerDistribution,
  PlayerGameState,
  Question,
} from '@shared/types';
import { Quiz } from '@shared/types';
import { calculateScore, ScoreBreakdown } from '@shared/types';
import { checkAnswer } from './answer-checker';

// Data structure for deferred DB writes (batched at end of question)
export interface PendingAnswerWrite {
  playerId: string;
  sessionId: string;
  questionId: string;
  answerId: string | null;
  isCorrect: boolean;
  timeTaken: number;
  score: number;
}

// Internal state that extends GameState with tracking data not sent to clients
interface InternalGameState extends GameState {
  // Full list of questions from the quiz (with correct answers)
  questions: Question[];
  // Map of playerId -> answer data for the current question
  currentAnswers: Map<string, { answerId: string | string[]; timeTaken: number; scoreBreakdown: ScoreBreakdown }>;
  // Deferred DB writes for current question
  pendingAnswerWrites: PendingAnswerWrite[];
  // Leaderboard cache
  _cachedLeaderboard: LeaderboardEntry[] | null;
  _leaderboardDirty: boolean;
}

class GameStateManager {
  private states: Map<string, InternalGameState> = new Map();

  /**
   * Initialize a full game state from a session and its quiz data.
   * Stores all questions so they can be served one at a time.
   */
  createGameState(session: GameSession, quiz: Quiz): GameState {
    const state: InternalGameState = {
      session: { ...session, status: 'lobby' },
      players: [],
      leaderboard: [],
      totalQuestions: quiz.questions.length,
      questions: quiz.questions,
      currentAnswers: new Map(),
      pendingAnswerWrites: [],
      _cachedLeaderboard: null,
      _leaderboardDirty: true,
    };

    this.states.set(session.id, state);
    return this.toPublicState(state);
  }

  /**
   * Get the public game state for a session (or undefined if not found).
   */
  getGameState(sessionId: string): GameState | undefined {
    const state = this.states.get(sessionId);
    if (!state) return undefined;
    return this.toPublicState(state);
  }

  /**
   * Remove game state for a session (cleanup).
   */
  removeGameState(sessionId: string): void {
    this.states.delete(sessionId);
  }

  /**
   * Add a player to the game state.
   */
  addPlayer(sessionId: string, player: Player): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    // Avoid adding duplicate players
    const existing = state.players.find((p) => p.id === player.id);
    if (!existing) {
      state.players.push({ ...player });
      state._leaderboardDirty = true;
    }
  }

  /**
   * Remove a player from the game state.
   */
  removePlayer(sessionId: string, playerId: string): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    state.players = state.players.filter((p) => p.id !== playerId);
    state._leaderboardDirty = true;
  }

  /**
   * Mark a player as connected or disconnected.
   */
  setPlayerConnected(sessionId: string, playerId: string, connected: boolean): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    const player = state.players.find((p) => p.id === playerId);
    if (player) {
      player.isConnected = connected;
    }
  }

  /**
   * Advance to the next question. Increments currentQuestionIndex, sets status to 'question',
   * records questionStartedAt, and clears current answers map.
   * Returns the new question index, or -1 if there are no more questions.
   */
  advanceToQuestion(sessionId: string): number {
    const state = this.states.get(sessionId);
    if (!state) return -1;

    const nextIndex = state.session.currentQuestionIndex + 1;

    // If this is the first question (moving from lobby/starting), use index 0
    const targetIndex = state.session.status === 'lobby' || state.session.status === 'starting'
      ? 0
      : nextIndex;

    if (targetIndex >= state.questions.length) {
      return -1; // No more questions
    }

    state.session.currentQuestionIndex = targetIndex;
    state.session.status = 'question';
    state.questionStartedAt = Date.now();
    state.currentAnswers = new Map();
    state.pendingAnswerWrites = [];
    state._leaderboardDirty = true;
    state._cachedLeaderboard = null;

    // Set the current question (with correct answer info -- host view)
    state.currentQuestion = state.questions[targetIndex];

    return targetIndex;
  }

  /**
   * Update the game status.
   */
  setStatus(sessionId: string, status: GameStatus): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    state.session.status = status;
  }

  /**
   * Set the share token on the session.
   */
  setShareToken(sessionId: string, shareToken: string): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    state.session.shareToken = shareToken;
  }

  /**
   * Record a player's answer for the current question.
   * Calculates score using the shared scoring function with correctRatio support.
   * Updates the player's score and streak in state.
   * Returns the ScoreBreakdown, or undefined if invalid.
   */
  recordAnswer(
    sessionId: string,
    playerId: string,
    answerId: string | string[],
    timeTaken: number
  ): ScoreBreakdown | undefined {
    const state = this.states.get(sessionId);
    if (!state) return undefined;

    // Don't allow duplicate answers for the same question
    if (state.currentAnswers.has(playerId)) {
      return undefined;
    }

    const question = state.currentQuestion;
    if (!question) return undefined;

    const player = state.players.find((p) => p.id === playerId);
    if (!player) return undefined;

    // Use answer checker for all question types
    const { isCorrect, correctRatio } = checkAnswer(question, answerId);

    const isNumberGuess = question.questionType === 'number-guess';

    // Streak logic:
    // - Normal questions: streak continues only for fully correct (correctRatio === 1.0)
    // - Number-guess: streak continues if within tolerance (correctRatio > 0),
    //   but streak does NOT affect scoring (pass 0)
    const currentStreak = isNumberGuess
      ? 0 // number-guess: streak not used in scoring
      : (correctRatio >= 1.0 ? player.streak : 0);

    // Calculate score with correctRatio
    const scoreBreakdown = calculateScore(
      isCorrect,
      timeTaken,
      question.timeLimit,
      currentStreak,
      correctRatio,
      undefined,
      isNumberGuess ? { noTimeBonus: true } : undefined
    );

    // Update player state
    player.score += scoreBreakdown.totalPoints;
    if (isNumberGuess) {
      // Number-guess: streak continues if answer is within tolerance
      player.streak = correctRatio > 0 ? player.streak + 1 : 0;
    } else {
      player.streak = correctRatio >= 1.0 ? player.streak + 1 : 0;
    }

    // Mark leaderboard cache as dirty since score changed
    state._leaderboardDirty = true;

    // Record the answer
    state.currentAnswers.set(playerId, {
      answerId,
      timeTaken,
      scoreBreakdown,
    });

    return scoreBreakdown;
  }

  /**
   * Reset streaks for players who didn't answer in time.
   * Should be called when transitioning to answers phase.
   * Returns array of {playerId, score} for players whose streaks were reset.
   */
  resetStreaksForUnanswered(sessionId: string): { playerId: string; score: number }[] {
    const state = this.states.get(sessionId);
    if (!state) return [];

    const resetPlayers: { playerId: string; score: number }[] = [];
    for (const player of state.players) {
      if (!state.currentAnswers.has(player.id)) {
        player.streak = 0;
        resetPlayers.push({ playerId: player.id, score: player.score });
      }
    }
    if (resetPlayers.length > 0) {
      state._leaderboardDirty = true;
    }
    return resetPlayers;
  }

  /**
   * Add a pending answer write for batch DB insertion.
   */
  addPendingAnswerWrite(sessionId: string, write: PendingAnswerWrite): void {
    const state = this.states.get(sessionId);
    if (!state) return;
    state.pendingAnswerWrites.push(write);
  }

  /**
   * Get and clear all pending answer writes for batch DB insertion.
   */
  flushPendingAnswerWrites(sessionId: string): PendingAnswerWrite[] {
    const state = this.states.get(sessionId);
    if (!state) return [];
    const writes = state.pendingAnswerWrites;
    state.pendingAnswerWrites = [];
    return writes;
  }

  /**
   * Get answer progress for the current question (how many connected players have answered).
   */
  getAnswerProgress(sessionId: string): { answered: number; total: number } | undefined {
    const state = this.states.get(sessionId);
    if (!state) return undefined;
    const connectedPlayers = state.players.filter((p) => p.isConnected);
    const answered = connectedPlayers.filter((p) => state.currentAnswers.has(p.id)).length;
    return { answered, total: connectedPlayers.length };
  }

  /**
   * Get all player scores for batch DB update.
   */
  getAllPlayerScores(sessionId: string): { id: string; score: number; streak: number }[] {
    const state = this.states.get(sessionId);
    if (!state) return [];
    return state.players.map((p) => ({ id: p.id, score: p.score, streak: p.streak }));
  }

  /**
   * Get sorted leaderboard entries from the current state.
   */
  getLeaderboard(sessionId: string): LeaderboardEntry[] {
    const state = this.states.get(sessionId);
    if (!state) return [];

    // Return cached leaderboard if available and not dirty
    if (!state._leaderboardDirty && state._cachedLeaderboard) {
      return state._cachedLeaderboard;
    }

    const sorted = [...state.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker: earlier join time
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    const leaderboard = sorted.map((player, index) => {
      const answerData = state.currentAnswers.get(player.id);
      return {
        playerId: player.id,
        nickname: player.nickname,
        score: player.score,
        rank: index + 1,
        streak: player.streak,
        lastScoreBreakdown: answerData?.scoreBreakdown,
      };
    });

    // Cache the result
    state._cachedLeaderboard = leaderboard;
    state._leaderboardDirty = false;

    return leaderboard;
  }

  /**
   * Get the answer distribution for the current question.
   * For multi-select and ordering, a single player's answer can count toward multiple answers.
   */
  getAnswerDistribution(sessionId: string): AnswerDistribution[] {
    const state = this.states.get(sessionId);
    if (!state || !state.currentQuestion) return [];

    const question = state.currentQuestion;

    // Number-guess questions have no predefined answers
    if (question.questionType === 'number-guess') {
      return [];
    }

    return question.answers.map((answer) => {
      let count = 0;
      state.currentAnswers.forEach((data) => {
        if (Array.isArray(data.answerId)) {
          // multi-select or ordering: check if this answer is in the array
          if (data.answerId.includes(answer.id)) {
            count++;
          }
        } else {
          if (data.answerId === answer.id) {
            count++;
          }
        }
      });

      // For ordering questions, mark as "correct" based on orderIndex position
      const isCorrect = question.questionType === 'ordering'
        ? true // all answers in ordering are part of the sequence
        : answer.isCorrect;

      return {
        answerId: answer.id,
        answerText: answer.text,
        count,
        isCorrect,
        orderIndex: answer.orderIndex,
      };
    });
  }

  /**
   * Get the PlayerGameState for a specific player.
   * Strips correct answer information from question data.
   */
  getPlayerGameState(sessionId: string, playerId: string, precomputedLeaderboard?: LeaderboardEntry[]): PlayerGameState | undefined {
    const state = this.states.get(sessionId);
    if (!state) return undefined;

    const player = state.players.find((p) => p.id === playerId);
    if (!player) return undefined;

    // Build question data — reveal correct answer for number-guess after answer phase
    let currentQuestion: PlayerGameState['currentQuestion'] | undefined;
    if (state.currentQuestion) {
      const revealAnswer = state.session.status !== 'question' && state.session.status !== 'starting';
      currentQuestion = {
        id: state.currentQuestion.id,
        text: state.currentQuestion.text,
        description: state.currentQuestion.description,
        imageUrl: state.currentQuestion.imageUrl,
        questionType: state.currentQuestion.questionType,
        requireAll: state.currentQuestion.requireAll,
        timeLimit: state.currentQuestion.timeLimit,
        answers: state.currentQuestion.answers.map((a) => ({
          id: a.id,
          text: a.text,
          orderIndex: a.orderIndex,
        })),
        ...(revealAnswer && state.currentQuestion.questionType === 'number-guess' ? {
          correctNumber: state.currentQuestion.correctNumber,
          tolerance: state.currentQuestion.tolerance,
        } : {}),
      };
    }

    // Check if this player has answered the current question
    const hasAnswered = state.currentAnswers.has(playerId);
    const answerData = state.currentAnswers.get(playerId);

    // Build leaderboard if in leaderboard or finished state
    let leaderboard: LeaderboardEntry[] | undefined;
    let finalRank: number | undefined;
    if (state.session.status === 'leaderboard' || state.session.status === 'finished') {
      leaderboard = precomputedLeaderboard || this.getLeaderboard(sessionId);
      const entry = leaderboard.find((e) => e.playerId === playerId);
      finalRank = entry?.rank;
    }

    return {
      sessionId: state.session.id,
      pin: state.session.pin,
      status: state.session.status,
      currentQuestionIndex: state.session.currentQuestionIndex,
      totalQuestions: state.totalQuestions,
      player: { ...player },
      currentQuestion,
      questionStartedAt: state.questionStartedAt,
      lastResult: answerData?.scoreBreakdown,
      hasAnswered,
      leaderboard,
      finalRank,
    };
  }

  /**
   * Check if all connected players have answered the current question.
   */
  hasAllPlayersAnswered(sessionId: string): boolean {
    const state = this.states.get(sessionId);
    if (!state) return false;

    const connectedPlayers = state.players.filter((p) => p.isConnected);
    if (connectedPlayers.length === 0) return false;

    return connectedPlayers.every((p) => state.currentAnswers.has(p.id));
  }

  /**
   * Get the current question from stored quiz data (with full answer info including isCorrect).
   */
  getCurrentQuestion(sessionId: string): Question | undefined {
    const state = this.states.get(sessionId);
    if (!state) return undefined;

    return state.currentQuestion;
  }

  /**
   * Convert internal state to public GameState (strips internal tracking data).
   */
  private toPublicState(state: InternalGameState): GameState {
    return {
      session: { ...state.session },
      players: state.players.map((p) => ({ ...p })),
      currentQuestion: state.currentQuestion ? { ...state.currentQuestion } : undefined,
      leaderboard: this.getLeaderboard(state.session.id),
      answerDistribution: state.session.status === 'result'
        ? this.getAnswerDistribution(state.session.id)
        : undefined,
      questionStartedAt: state.questionStartedAt,
      totalQuestions: state.totalQuestions,
      answeredCount: state.currentAnswers.size,
    };
  }
}

export const gameStateManager = new GameStateManager();
