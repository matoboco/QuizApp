import { GameSession, Player, CreateGameResponse, JoinGameResponse } from '@shared/types';
import { gameRepository, playerRepository, quizRepository } from '../db/repositories';
import { authService } from '../auth/auth.service';
import { generateUniquePin } from '../utils/pin-generator';
import {
  NotFoundError,
  ValidationError,
  ConflictError,
} from '../middleware/error.middleware';

class GameService {
  async createGame(
    hostId: string,
    quizId: string
  ): Promise<CreateGameResponse> {
    // Verify the quiz exists
    const quiz = quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    // Generate a unique PIN by collecting all existing active PINs
    const activeGame = gameRepository.findActiveByHostId(hostId);
    const existingPins = new Set<string>();
    if (activeGame) {
      existingPins.add(activeGame.pin);
    }

    const pin = generateUniquePin(existingPins);

    // Create the game session
    const session = gameRepository.create({
      quizId,
      hostId,
      pin,
    });

    return {
      sessionId: session.id,
      pin: session.pin,
    };
  }

  async joinGame(
    pin: string,
    nickname: string
  ): Promise<JoinGameResponse> {
    // Find the session by PIN
    const session = gameRepository.findByPin(pin);
    if (!session) {
      throw new NotFoundError('Game session not found');
    }

    // Verify the game is in lobby status
    if (session.status !== 'lobby') {
      throw new ValidationError('Game is not accepting new players');
    }

    // Check nickname uniqueness within the session
    const nicknameTaken = playerRepository.existsNicknameInSession(
      session.id,
      nickname
    );
    if (nicknameTaken) {
      throw new ConflictError('Nickname is already taken in this game');
    }

    // Create the player
    const player = playerRepository.create({
      sessionId: session.id,
      nickname,
    });

    // Generate a player JWT token
    const token = authService.generatePlayerToken(player.id, session.id);

    return {
      playerId: player.id,
      sessionId: session.id,
      token,
    };
  }

  getGameSession(
    sessionId: string
  ): { session: GameSession; players: Player[] } {
    const session = gameRepository.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Game session not found');
    }

    const players = playerRepository.findBySessionId(sessionId);

    return { session, players };
  }

  getActiveGameForHost(hostId: string): GameSession | undefined {
    return gameRepository.findActiveByHostId(hostId);
  }
}

export const gameService = new GameService();
