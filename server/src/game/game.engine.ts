import crypto from 'crypto';
import { Server } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  LeaderboardEntry,
} from '@shared/types';
import { gameStateManager } from './game-state.manager';
import {
  gameRepository,
  quizRepository,
  playerRepository,
  playerAnswerRepository,
} from '../db/repositories';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Room name helpers
function hostRoom(sessionId: string): string {
  return `host:${sessionId}`;
}

function playerRoom(sessionId: string): string {
  return `player:${sessionId}`;
}

function playerIndividualRoom(playerId: string): string {
  return `player:${playerId}`;
}

class GameEngine {
  private io!: TypedServer;
  private questionTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Initialize the engine with the Socket.IO server instance.
   * Must be called before any other methods.
   */
  initialize(io: TypedServer): void {
    this.io = io;
  }

  /**
   * Ensure in-memory game state exists for a lobby session.
   * Called when host connects so the lobby UI can render immediately.
   * Returns the GameState or undefined if session/quiz not found.
   */
  async ensureLobbyState(sessionId: string): Promise<ReturnType<typeof gameStateManager.getGameState>> {
    // Already in memory? Just return it.
    const existing = gameStateManager.getGameState(sessionId);
    if (existing) return existing;

    const session = await gameRepository.findById(sessionId);
    if (!session) return undefined;

    const quiz = await quizRepository.findById(session.quizId);
    if (!quiz) return undefined;

    // Create in-memory state and load existing players from DB
    gameStateManager.createGameState(session, quiz);
    const players = await playerRepository.findBySessionId(sessionId);
    for (const player of players) {
      gameStateManager.addPlayer(sessionId, player);
    }

    return gameStateManager.getGameState(sessionId);
  }

  /**
   * Start a game: load quiz data, initialize in-memory state,
   * update DB status, and emit state to host.
   */
  async startGame(sessionId: string): Promise<void> {
    const session = await gameRepository.findById(sessionId);
    if (!session) {
      this.emitError(hostRoom(sessionId), 'Game session not found');
      return;
    }

    const quiz = await quizRepository.findById(session.quizId);
    if (!quiz) {
      this.emitError(hostRoom(sessionId), 'Quiz not found');
      return;
    }

    if (quiz.questions.length === 0) {
      this.emitError(hostRoom(sessionId), 'Quiz has no questions');
      return;
    }

    // Ensure in-memory game state exists (may already from lobby)
    if (!gameStateManager.getGameState(sessionId)) {
      gameStateManager.createGameState(session, quiz);
    }

    // Load existing players from DB into state (in case any are missing)
    const players = await playerRepository.findBySessionId(sessionId);
    for (const player of players) {
      gameStateManager.addPlayer(sessionId, player);
    }

    // Update DB status
    await gameRepository.updateStatus(sessionId, 'starting', {
      startedAt: new Date().toISOString(),
    });
    gameStateManager.setStatus(sessionId, 'starting');

    // Emit state to host
    const state = gameStateManager.getGameState(sessionId);
    if (state) {
      this.io.to(hostRoom(sessionId)).emit('game:state-update', state);
    }

    // Notify all players that the game is starting
    this.io.to(playerRoom(sessionId)).emit('player:game-status', 'starting');

    // Auto-advance to the first question after a brief "Get Ready" delay
    setTimeout(() => {
      this.nextQuestion(sessionId);
    }, 3000);
  }

  /**
   * Advance to the next question. Emits the question to players
   * (without correct answer info), emits full state to host,
   * and starts the countdown timer.
   */
  async nextQuestion(sessionId: string): Promise<void> {
    // Clear any existing timer for this session
    this.clearTimer(sessionId);

    const questionIndex = gameStateManager.advanceToQuestion(sessionId);
    if (questionIndex === -1) {
      // No more questions -- end the game
      await this.endGame(sessionId);
      return;
    }

    // Update DB with current question index
    await gameRepository.updateStatus(sessionId, 'question', {
      currentQuestionIndex: questionIndex,
    });

    const question = gameStateManager.getCurrentQuestion(sessionId);
    const state = gameStateManager.getGameState(sessionId);
    if (!question || !state) return;

    // Emit full state to host (includes correct answers)
    this.io.to(hostRoom(sessionId)).emit('game:state-update', state);

    // Emit question to players (without correct answers)
    this.io.to(playerRoom(sessionId)).emit('player:question', {
      id: question.id,
      text: question.text,
      imageUrl: question.imageUrl,
      questionType: question.questionType,
      requireAll: question.requireAll,
      timeLimit: question.timeLimit,
      answers: question.answers.map((a) => ({
        id: a.id,
        text: a.text,
        orderIndex: a.orderIndex,
      })),
      questionIndex: state.session.currentQuestionIndex,
      totalQuestions: state.totalQuestions,
    });

    // Notify players of the new status
    this.io.to(playerRoom(sessionId)).emit('player:game-status', 'question');

    // Start countdown timer
    this.startCountdown(sessionId, question.timeLimit);
  }

  /**
   * Submit an answer for a player. Records it in state and DB,
   * emits result to the player, emits progress to host,
   * and checks if all players have answered.
   */
  async submitAnswer(
    sessionId: string,
    playerId: string,
    questionId: string,
    answerId: string | string[]
  ): Promise<void> {
    const question = gameStateManager.getCurrentQuestion(sessionId);
    if (!question || question.id !== questionId) {
      this.io.to(playerIndividualRoom(playerId)).emit('error', 'Invalid question');
      return;
    }

    // Calculate time taken
    const state = gameStateManager.getGameState(sessionId);
    if (!state || state.session.status !== 'question') {
      this.io.to(playerIndividualRoom(playerId)).emit('error', 'Not accepting answers');
      return;
    }

    const timeTaken = state.questionStartedAt
      ? Date.now() - state.questionStartedAt
      : 0;

    // Record in state and get score breakdown
    const scoreBreakdown = gameStateManager.recordAnswer(
      sessionId,
      playerId,
      answerId,
      timeTaken
    );

    if (!scoreBreakdown) {
      // Already answered or invalid
      this.io.to(playerIndividualRoom(playerId)).emit('error', 'Answer already submitted or invalid');
      return;
    }

    // Persist to DB (store first answerId for single answers, or first from array)
    const dbAnswerId = Array.isArray(answerId) ? answerId[0] || null : answerId;
    // For number-guess, any answer within tolerance counts as correct for history
    const dbIsCorrect = question.questionType === 'number-guess'
      ? scoreBreakdown.correctRatio > 0
      : scoreBreakdown.isCorrect;
    await playerAnswerRepository.create({
      playerId,
      sessionId,
      questionId,
      answerId: dbAnswerId,
      isCorrect: dbIsCorrect,
      timeTaken,
      score: scoreBreakdown.totalPoints,
    });

    // Update player score in DB
    const playerState = gameStateManager.getPlayerGameState(sessionId, playerId);
    if (playerState) {
      await playerRepository.updateScore(
        playerId,
        playerState.player.score,
        playerState.player.streak
      );
    }

    // Emit result to the individual player
    this.io.to(playerIndividualRoom(playerId)).emit('player:answer-result', scoreBreakdown);

    // Emit progress to host
    const updatedState = gameStateManager.getGameState(sessionId);
    if (updatedState) {
      const connectedPlayers = updatedState.players.filter((p) => p.isConnected);
      const answeredCount = connectedPlayers.filter((p) => {
        // Check if player has answered by looking at player game state
        const pState = gameStateManager.getPlayerGameState(sessionId, p.id);
        return pState?.hasAnswered;
      }).length;

      this.io.to(hostRoom(sessionId)).emit('game:player-answered', {
        playerId,
        totalAnswered: answeredCount,
        totalPlayers: connectedPlayers.length,
      });
    }

    // Check if all connected players have answered
    if (gameStateManager.hasAllPlayersAnswered(sessionId)) {
      // Clear the timer since everyone answered
      this.clearTimer(sessionId);

      // Emit time-up to signal that the question phase is over
      this.io.to(hostRoom(sessionId)).emit('game:time-up');
      this.io.to(playerRoom(sessionId)).emit('game:time-up');

      // Auto-advance to answers phase after a brief pause
      setTimeout(() => {
        this.showAnswers(sessionId);
      }, 1500);
    }
  }

  /**
   * Show answers phase: set status and emit to host.
   * Auto-advances to result phase after 3 seconds.
   */
  async showAnswers(sessionId: string): Promise<void> {
    // Reset streak for players who didn't answer in time and persist to DB
    const resetPlayers = gameStateManager.resetStreaksForUnanswered(sessionId);
    for (const { playerId, score } of resetPlayers) {
      await playerRepository.updateScore(playerId, score, 0);
    }

    gameStateManager.setStatus(sessionId, 'answers');
    await gameRepository.updateStatus(sessionId, 'answers');

    const state = gameStateManager.getGameState(sessionId);
    if (state) {
      this.io.to(hostRoom(sessionId)).emit('game:state-update', state);
    }

    // Notify players
    this.io.to(playerRoom(sessionId)).emit('player:game-status', 'answers');

    // Auto-advance to result phase
    setTimeout(() => {
      const s = gameStateManager.getGameState(sessionId);
      if (s?.session.status === 'answers') {
        this.showResult(sessionId);
      }
    }, 3000);
  }

  /**
   * Show result phase: set status, emit answer distribution to host.
   * Auto-advances to leaderboard phase after 5 seconds.
   */
  async showResult(sessionId: string): Promise<void> {
    gameStateManager.setStatus(sessionId, 'result');
    await gameRepository.updateStatus(sessionId, 'result');

    const distribution = gameStateManager.getAnswerDistribution(sessionId);
    const state = gameStateManager.getGameState(sessionId);

    if (state) {
      this.io.to(hostRoom(sessionId)).emit('game:state-update', state);
    }

    this.io.to(hostRoom(sessionId)).emit('game:answer-distribution', distribution);

    // Notify players
    this.io.to(playerRoom(sessionId)).emit('player:game-status', 'result');

    // Auto-advance to leaderboard phase
    setTimeout(() => {
      const s = gameStateManager.getGameState(sessionId);
      if (s?.session.status === 'result') {
        this.showLeaderboard(sessionId);
      }
    }, 5000);
  }

  /**
   * Show leaderboard phase: set status, emit leaderboard to all participants.
   * Auto-advances to next question (or ends game) after 5 seconds.
   */
  async showLeaderboard(sessionId: string): Promise<void> {
    gameStateManager.setStatus(sessionId, 'leaderboard');
    await gameRepository.updateStatus(sessionId, 'leaderboard');

    const leaderboard = gameStateManager.getLeaderboard(sessionId);
    const state = gameStateManager.getGameState(sessionId);

    if (state) {
      this.io.to(hostRoom(sessionId)).emit('game:state-update', state);
    }

    this.io.to(hostRoom(sessionId)).emit('game:leaderboard', leaderboard);
    this.io.to(playerRoom(sessionId)).emit('game:leaderboard', leaderboard);

    // Send individual player state updates so each player sees their own rank
    this.emitPlayerStates(sessionId);

    // Auto-advance to next question or end game
    setTimeout(() => {
      const s = gameStateManager.getGameState(sessionId);
      if (s?.session.status === 'leaderboard') {
        // Check if there are more questions
        const isLastQuestion =
          s.session.currentQuestionIndex >= s.totalQuestions - 1;
        if (isLastQuestion) {
          this.endGame(sessionId);
        } else {
          this.nextQuestion(sessionId);
        }
      }
    }, 5000);
  }

  /**
   * End the game: set status to finished, persist final scores,
   * emit final results, and schedule cleanup.
   */
  async endGame(sessionId: string): Promise<void> {
    this.clearTimer(sessionId);

    gameStateManager.setStatus(sessionId, 'finished');
    await gameRepository.updateStatus(sessionId, 'finished', {
      finishedAt: new Date().toISOString(),
    });

    // Auto-generate share token so results can be shared immediately
    const shareToken = crypto.randomBytes(16).toString('hex');
    await gameRepository.setShareToken(sessionId, shareToken);
    gameStateManager.setShareToken(sessionId, shareToken);

    const leaderboard = gameStateManager.getLeaderboard(sessionId);

    // Persist final scores to DB
    for (const entry of leaderboard) {
      await playerRepository.updateScore(entry.playerId, entry.score, entry.streak);
    }

    // Emit final state to host
    const state = gameStateManager.getGameState(sessionId);
    if (state) {
      this.io.to(hostRoom(sessionId)).emit('game:state-update', state);
    }

    // Emit finished event to host
    this.io.to(hostRoom(sessionId)).emit('game:finished', leaderboard);

    // Emit final results to each player individually with their rank
    this.emitFinalResults(sessionId, leaderboard);

    // Schedule cleanup of in-memory state after 5 minutes
    setTimeout(() => {
      gameStateManager.removeGameState(sessionId);
      console.log(`[game-engine] Cleaned up game state for session ${sessionId}`);
    }, 5 * 60 * 1000);
  }

  /**
   * Kick a player from the game.
   */
  async kickPlayer(sessionId: string, playerId: string): Promise<void> {
    // Notify the player they've been kicked
    this.io.to(playerIndividualRoom(playerId)).emit('player:kicked');

    // Remove from in-memory state
    gameStateManager.removePlayer(sessionId, playerId);

    // Update DB
    await playerRepository.setConnected(playerId, false);

    // Notify host
    this.io.to(hostRoom(sessionId)).emit('game:player-left', playerId);

    const state = gameStateManager.getGameState(sessionId);
    if (state) {
      this.io.to(hostRoom(sessionId)).emit('game:state-update', state);
    }
  }

  /**
   * Handle player reconnection: rejoin rooms and send current state.
   */
  async handleReconnect(
    socketId: string,
    sessionId: string,
    playerId?: string
  ): Promise<void> {
    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) return;

    if (playerId) {
      // Player reconnecting
      gameStateManager.setPlayerConnected(sessionId, playerId, true);
      await playerRepository.setConnected(playerId, true);

      // Rejoin rooms
      socket.join(playerRoom(sessionId));
      socket.join(playerIndividualRoom(playerId));

      // Send current player state
      const playerState = gameStateManager.getPlayerGameState(sessionId, playerId);
      if (playerState) {
        socket.emit('player:state-update', playerState);
      }

      // Notify host of reconnection
      const state = gameStateManager.getGameState(sessionId);
      if (state) {
        this.io.to(hostRoom(sessionId)).emit('game:state-update', state);
      }
    } else {
      // Host reconnecting
      socket.join(hostRoom(sessionId));

      const state = gameStateManager.getGameState(sessionId);
      if (state) {
        socket.emit('game:state-update', state);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Start a countdown timer for a question.
   * Emits countdown events every second and auto-advances when time runs out.
   */
  private startCountdown(sessionId: string, timeLimitSeconds: number): void {
    let remaining = timeLimitSeconds;

    const tick = () => {
      if (remaining <= 0) {
        // Time is up
        this.clearTimer(sessionId);
        this.io.to(hostRoom(sessionId)).emit('game:time-up');
        this.io.to(playerRoom(sessionId)).emit('game:time-up');

        // Auto-advance to answers phase after a brief pause
        setTimeout(() => {
          this.showAnswers(sessionId);
        }, 1500);
        return;
      }

      this.io.to(hostRoom(sessionId)).emit('game:countdown', remaining);
      this.io.to(playerRoom(sessionId)).emit('game:countdown', remaining);
      remaining--;

      const timer = setTimeout(tick, 1000);
      this.questionTimers.set(sessionId, timer);
    };

    // Start the first tick immediately
    tick();
  }

  /**
   * Clear the countdown timer for a session.
   */
  private clearTimer(sessionId: string): void {
    const timer = this.questionTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.questionTimers.delete(sessionId);
    }
  }

  /**
   * Emit an error to a specific room.
   */
  private emitError(room: string, message: string): void {
    this.io.to(room).emit('error', message);
  }

  /**
   * Emit individual player state updates to each player in a session.
   */
  private emitPlayerStates(sessionId: string): void {
    const state = gameStateManager.getGameState(sessionId);
    if (!state) return;

    for (const player of state.players) {
      const playerState = gameStateManager.getPlayerGameState(sessionId, player.id);
      if (playerState) {
        this.io.to(playerIndividualRoom(player.id)).emit('player:state-update', playerState);
      }
    }
  }

  /**
   * Emit final game results to each player with their individual rank.
   */
  private emitFinalResults(sessionId: string, leaderboard: LeaderboardEntry[]): void {
    for (const entry of leaderboard) {
      this.io.to(playerIndividualRoom(entry.playerId)).emit('player:game-finished', {
        rank: entry.rank,
        totalScore: entry.score,
        leaderboard,
      });
    }
  }
}

export const gameEngine = new GameEngine();
