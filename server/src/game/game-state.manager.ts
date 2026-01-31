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

// Internal state that extends GameState with tracking data not sent to clients
interface InternalGameState extends GameState {
  // Full list of questions from the quiz (with correct answers)
  questions: Question[];
  // Map of playerId -> answerId for the current question
  currentAnswers: Map<string, { answerId: string; timeTaken: number; scoreBreakdown: ScoreBreakdown }>;
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
    }
  }

  /**
   * Remove a player from the game state.
   */
  removePlayer(sessionId: string, playerId: string): void {
    const state = this.states.get(sessionId);
    if (!state) return;

    state.players = state.players.filter((p) => p.id !== playerId);
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
   * Record a player's answer for the current question.
   * Calculates score using the shared scoring function.
   * Updates the player's score and streak in state.
   * Returns the ScoreBreakdown, or undefined if invalid.
   */
  recordAnswer(
    sessionId: string,
    playerId: string,
    answerId: string,
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

    // Determine correctness
    const correctAnswer = question.answers.find((a) => a.isCorrect);
    const isCorrect = correctAnswer?.id === answerId;

    // Calculate the new streak value (before scoring, so current streak is used)
    const currentStreak = isCorrect ? player.streak : 0;

    // Calculate score
    const scoreBreakdown = calculateScore(
      isCorrect,
      timeTaken,
      question.timeLimit,
      currentStreak
    );

    // Update player state
    player.score += scoreBreakdown.totalPoints;
    player.streak = isCorrect ? player.streak + 1 : 0;

    // Record the answer
    state.currentAnswers.set(playerId, {
      answerId,
      timeTaken,
      scoreBreakdown,
    });

    return scoreBreakdown;
  }

  /**
   * Get sorted leaderboard entries from the current state.
   */
  getLeaderboard(sessionId: string): LeaderboardEntry[] {
    const state = this.states.get(sessionId);
    if (!state) return [];

    const sorted = [...state.players].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreaker: earlier join time
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    return sorted.map((player, index) => {
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
  }

  /**
   * Get the answer distribution for the current question.
   */
  getAnswerDistribution(sessionId: string): AnswerDistribution[] {
    const state = this.states.get(sessionId);
    if (!state || !state.currentQuestion) return [];

    const question = state.currentQuestion;

    return question.answers.map((answer) => {
      let count = 0;
      state.currentAnswers.forEach((data) => {
        if (data.answerId === answer.id) {
          count++;
        }
      });

      return {
        answerId: answer.id,
        answerText: answer.text,
        count,
        isCorrect: answer.isCorrect,
        orderIndex: answer.orderIndex,
      };
    });
  }

  /**
   * Get the PlayerGameState for a specific player.
   * Strips correct answer information from question data.
   */
  getPlayerGameState(sessionId: string, playerId: string): PlayerGameState | undefined {
    const state = this.states.get(sessionId);
    if (!state) return undefined;

    const player = state.players.find((p) => p.id === playerId);
    if (!player) return undefined;

    // Build question data without correct answer info
    let currentQuestion: PlayerGameState['currentQuestion'] | undefined;
    if (state.currentQuestion) {
      currentQuestion = {
        id: state.currentQuestion.id,
        text: state.currentQuestion.text,
        imageUrl: state.currentQuestion.imageUrl,
        timeLimit: state.currentQuestion.timeLimit,
        answers: state.currentQuestion.answers.map((a) => ({
          id: a.id,
          text: a.text,
          orderIndex: a.orderIndex,
        })),
      };
    }

    // Check if this player has answered the current question
    const hasAnswered = state.currentAnswers.has(playerId);
    const answerData = state.currentAnswers.get(playerId);

    // Build leaderboard if in leaderboard or finished state
    let leaderboard: LeaderboardEntry[] | undefined;
    let finalRank: number | undefined;
    if (state.session.status === 'leaderboard' || state.session.status === 'finished') {
      leaderboard = this.getLeaderboard(sessionId);
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
    };
  }
}

export const gameStateManager = new GameStateManager();
