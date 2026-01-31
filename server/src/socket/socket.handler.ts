import { Server, Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@shared/types';
import { socketAuthMiddleware } from './socket.auth';
import { handleReconnection } from './reconnection.handler';
import { gameEngine } from '../game/game.engine';
import { gameStateManager } from '../game/game-state.manager';
import {
  gameRepository,
  playerRepository,
} from '../db/repositories';
import { authService } from '../auth/auth.service';

type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TypedSocket = Socket<
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

/**
 * Set up all Socket.IO event handlers.
 * Applies authentication middleware and registers host/player/common events.
 */
export function setupSocketHandlers(io: TypedServer): void {
  // Apply authentication middleware
  io.use(socketAuthMiddleware);

  io.on('connection', (socket: TypedSocket) => {
    console.log(
      `[socket.io] Client connected: ${socket.id} (type: ${socket.data.type}, userId: ${socket.data.userId || 'none'}, playerId: ${socket.data.playerId || 'none'})`
    );

    // --- Join appropriate rooms on connection ---
    try {
      if (socket.data.type === 'host' && socket.data.userId) {
        // Host: find their active session and join host room
        const activeSession = gameRepository.findActiveByHostId(socket.data.userId);
        if (activeSession) {
          socket.join(hostRoom(activeSession.id));
          console.log(`[socket.io] Host ${socket.data.userId} joined room ${hostRoom(activeSession.id)}`);

          // Ensure in-memory state exists (creates it for lobby sessions)
          const state = gameEngine.ensureLobbyState(activeSession.id);
          if (state) {
            socket.emit('game:state-update', state);
          }
        }
      } else if (socket.data.type === 'player' && socket.data.playerId && socket.data.sessionId) {
        // Returning player with token: join rooms automatically
        const { playerId, sessionId } = socket.data;
        socket.join(playerRoom(sessionId));
        socket.join(playerIndividualRoom(playerId));

        // Mark player as connected
        gameStateManager.setPlayerConnected(sessionId, playerId, true);
        playerRepository.setConnected(playerId, true);

        console.log(`[socket.io] Player ${playerId} joined rooms for session ${sessionId}`);

        // Send current player state
        const playerState = gameStateManager.getPlayerGameState(sessionId, playerId);
        if (playerState) {
          socket.emit('player:state-update', playerState);
        }
      }
    } catch (err) {
      console.error(`[socket.io] Error during connection setup for ${socket.id}:`, err);
      socket.emit('error', 'An error occurred during connection setup');
    }

    // --- Register host events ---
    registerHostEvents(socket);

    // --- Register player events ---
    registerPlayerEvents(socket, io);

    // --- Register common events ---
    registerCommonEvents(socket, io);

    // --- Handle disconnect ---
    socket.on('disconnect', (reason) => {
      console.log(`[socket.io] Client disconnected: ${socket.id} (reason: ${reason})`);

      try {
        if (socket.data.type === 'player' && socket.data.playerId && socket.data.sessionId) {
          const { playerId, sessionId } = socket.data;

          // Mark player as disconnected
          gameStateManager.setPlayerConnected(sessionId, playerId, false);
          playerRepository.setConnected(playerId, false);

          // Notify host that a player disconnected
          const state = gameStateManager.getGameState(sessionId);
          if (state) {
            io.to(hostRoom(sessionId)).emit('game:player-left', playerId);
            io.to(hostRoom(sessionId)).emit('game:state-update', state);
          }

          console.log(`[socket.io] Player ${playerId} disconnected from session ${sessionId}`);
        }
      } catch (err) {
        console.error(`[socket.io] Error handling disconnect for ${socket.id}:`, err);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Host event handlers
// ---------------------------------------------------------------------------

function registerHostEvents(socket: TypedSocket): void {
  socket.on('host:start-game', async (sessionId: string) => {
    try {
      if (socket.data.type !== 'host') {
        socket.emit('error', 'Only hosts can start games');
        return;
      }

      // Verify the host owns this session
      const session = gameRepository.findById(sessionId);
      if (!session || session.hostId !== socket.data.userId) {
        socket.emit('error', 'Unauthorized: you do not own this game session');
        return;
      }

      // Join the host room for this session (in case not already joined)
      socket.join(hostRoom(sessionId));

      console.log(`[socket.io] Host starting game for session ${sessionId}`);
      await gameEngine.startGame(sessionId);
    } catch (err) {
      console.error(`[socket.io] Error in host:start-game for session ${sessionId}:`, err);
      socket.emit('error', 'An error occurred while starting the game');
    }
  });

  socket.on('host:next-question', async (sessionId: string) => {
    try {
      if (socket.data.type !== 'host') {
        socket.emit('error', 'Only hosts can advance questions');
        return;
      }

      console.log(`[socket.io] Host advancing to next question for session ${sessionId}`);
      await gameEngine.nextQuestion(sessionId);
    } catch (err) {
      console.error(`[socket.io] Error in host:next-question for session ${sessionId}:`, err);
      socket.emit('error', 'An error occurred while advancing the question');
    }
  });

  socket.on('host:show-answers', async (sessionId: string) => {
    try {
      if (socket.data.type !== 'host') {
        socket.emit('error', 'Only hosts can show answers');
        return;
      }

      console.log(`[socket.io] Host showing answers for session ${sessionId}`);
      await gameEngine.showAnswers(sessionId);
    } catch (err) {
      console.error(`[socket.io] Error in host:show-answers for session ${sessionId}:`, err);
      socket.emit('error', 'An error occurred while showing answers');
    }
  });

  socket.on('host:show-result', async (sessionId: string) => {
    try {
      if (socket.data.type !== 'host') {
        socket.emit('error', 'Only hosts can show results');
        return;
      }

      console.log(`[socket.io] Host showing result for session ${sessionId}`);
      await gameEngine.showResult(sessionId);
    } catch (err) {
      console.error(`[socket.io] Error in host:show-result for session ${sessionId}:`, err);
      socket.emit('error', 'An error occurred while showing results');
    }
  });

  socket.on('host:show-leaderboard', async (sessionId: string) => {
    try {
      if (socket.data.type !== 'host') {
        socket.emit('error', 'Only hosts can show leaderboard');
        return;
      }

      console.log(`[socket.io] Host showing leaderboard for session ${sessionId}`);
      await gameEngine.showLeaderboard(sessionId);
    } catch (err) {
      console.error(`[socket.io] Error in host:show-leaderboard for session ${sessionId}:`, err);
      socket.emit('error', 'An error occurred while showing the leaderboard');
    }
  });

  socket.on('host:end-game', async (sessionId: string) => {
    try {
      if (socket.data.type !== 'host') {
        socket.emit('error', 'Only hosts can end games');
        return;
      }

      console.log(`[socket.io] Host ending game for session ${sessionId}`);
      await gameEngine.endGame(sessionId);
    } catch (err) {
      console.error(`[socket.io] Error in host:end-game for session ${sessionId}:`, err);
      socket.emit('error', 'An error occurred while ending the game');
    }
  });

  socket.on('host:kick-player', async (data: { sessionId: string; playerId: string }) => {
    try {
      if (socket.data.type !== 'host') {
        socket.emit('error', 'Only hosts can kick players');
        return;
      }

      console.log(`[socket.io] Host kicking player ${data.playerId} from session ${data.sessionId}`);
      await gameEngine.kickPlayer(data.sessionId, data.playerId);
    } catch (err) {
      console.error(`[socket.io] Error in host:kick-player for session ${data.sessionId}:`, err);
      socket.emit('error', 'An error occurred while kicking the player');
    }
  });
}

// ---------------------------------------------------------------------------
// Player event handlers
// ---------------------------------------------------------------------------

function registerPlayerEvents(socket: TypedSocket, io: TypedServer): void {
  socket.on('player:join', async (
    data: { pin: string; nickname: string },
    callback: (response: { success: boolean; error?: string; playerId?: string; sessionId?: string }) => void
  ) => {
    try {
      // Find the session by PIN
      const session = gameRepository.findByPin(data.pin);
      if (!session) {
        callback({ success: false, error: 'Game not found. Check your PIN and try again.' });
        return;
      }

      // Verify the game is in lobby status
      if (session.status !== 'lobby') {
        callback({ success: false, error: 'This game is no longer accepting new players.' });
        return;
      }

      // Check nickname uniqueness within the session
      const nicknameTaken = playerRepository.existsNicknameInSession(session.id, data.nickname);
      if (nicknameTaken) {
        callback({ success: false, error: 'That nickname is already taken. Please choose another.' });
        return;
      }

      // Create the player in DB
      const player = playerRepository.create({
        sessionId: session.id,
        nickname: data.nickname,
      });

      // Generate player JWT
      const token = authService.generatePlayerToken(player.id, session.id);

      // Update socket data with player info
      socket.data.playerId = player.id;
      socket.data.sessionId = session.id;
      socket.data.type = 'player';

      // Join player rooms
      socket.join(playerRoom(session.id));
      socket.join(playerIndividualRoom(player.id));

      // Add to in-memory game state (if it exists; it may not yet if game hasn't started)
      gameStateManager.addPlayer(session.id, player);

      // Notify host that a new player joined
      io.to(hostRoom(session.id)).emit('game:player-joined', {
        id: player.id,
        nickname: player.nickname,
      });

      // Send updated state to host
      const state = gameStateManager.getGameState(session.id);
      if (state) {
        io.to(hostRoom(session.id)).emit('game:state-update', state);
      }

      console.log(`[socket.io] Player ${player.nickname} (${player.id}) joined session ${session.id}`);

      // Respond to the player with success (include JWT token for reconnection)
      callback({
        success: true,
        playerId: player.id,
        sessionId: session.id,
        token,
      });

      // Also send the player token via the handshake-style auth update
      // The client should store this token for reconnection
      // We emit a state update so the player has initial context
      const playerState = gameStateManager.getPlayerGameState(session.id, player.id);
      if (playerState) {
        socket.emit('player:state-update', playerState);
      }
    } catch (err) {
      console.error('[socket.io] Error in player:join:', err);
      callback({ success: false, error: 'An unexpected error occurred. Please try again.' });
    }
  });

  socket.on('player:submit-answer', async (data: { sessionId: string; questionId: string; answerId: string }) => {
    try {
      const playerId = socket.data.playerId;
      if (!playerId) {
        socket.emit('error', 'You must join a game before submitting answers');
        return;
      }

      console.log(`[socket.io] Player ${playerId} submitted answer for question ${data.questionId}`);
      await gameEngine.submitAnswer(data.sessionId, playerId, data.questionId, data.answerId);
    } catch (err) {
      console.error(`[socket.io] Error in player:submit-answer for player ${socket.data.playerId}:`, err);
      socket.emit('error', 'An error occurred while submitting your answer');
    }
  });
}

// ---------------------------------------------------------------------------
// Common event handlers
// ---------------------------------------------------------------------------

function registerCommonEvents(socket: TypedSocket, io: TypedServer): void {
  socket.on('reconnect-game', async (data: { sessionId: string; playerId?: string }) => {
    try {
      console.log(
        `[socket.io] Reconnect request: session=${data.sessionId}, playerId=${data.playerId || 'host'}`
      );

      // Delegate to the dedicated reconnection handler
      handleReconnection(socket, data.sessionId, data.playerId);
    } catch (err) {
      console.error(`[socket.io] Error in reconnect-game for session ${data.sessionId}:`, err);
      socket.emit('error', 'An error occurred during reconnection');
    }
  });
}
