import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@shared/types';
import { gameStateManager } from '../game/game-state.manager';
import { gameEngine } from '../game/game.engine';
import { gameRepository, playerRepository } from '../db/repositories';

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// Room name helpers (must match socket.handler.ts)
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
 * Handle reconnection for both host and player sockets.
 *
 * - For hosts: verifies ownership, re-joins the host room, and sends the
 *   full GameState via 'game:state-update'.
 * - For players: verifies membership, marks the player as connected,
 *   re-joins session and individual rooms, sends PlayerGameState via
 *   'player:state-update', and notifies the host of the reconnection.
 * - If the session no longer exists in memory (expired/cleaned up), an
 *   error is emitted to the socket.
 */
export function handleReconnection(
  socket: TypedSocket,
  sessionId: string,
  playerId?: string
): void {
  // ------------------------------------------------------------------
  // 1. Verify the session exists in the database
  // ------------------------------------------------------------------
  const session = gameRepository.findById(sessionId);
  if (!session) {
    socket.emit('error', 'Game session not found. It may have expired.');
    return;
  }

  // ------------------------------------------------------------------
  // 2. Ensure in-memory game state is available (creates it for lobby sessions)
  // ------------------------------------------------------------------
  const gameState = gameEngine.ensureLobbyState(sessionId);
  if (!gameState) {
    // The game state could not be created (quiz missing or session cleaned up).
    socket.emit(
      'error',
      'Game session state has expired. Please start or join a new game.'
    );
    return;
  }

  // ------------------------------------------------------------------
  // 3. Branch: host vs. player reconnection
  // ------------------------------------------------------------------
  if (playerId) {
    // ---------- Player reconnection ----------

    // Verify player exists in the database and belongs to this session
    const player = playerRepository.findById(playerId);
    if (!player || player.sessionId !== sessionId) {
      socket.emit('error', 'Player not found in this session');
      return;
    }

    // Update socket metadata so subsequent events know who this socket is
    socket.data.playerId = playerId;
    socket.data.sessionId = sessionId;
    socket.data.type = 'player';

    // Mark player as connected in both in-memory state and DB
    gameStateManager.setPlayerConnected(sessionId, playerId, true);
    playerRepository.setConnected(playerId, true);

    // Re-join player rooms
    socket.join(playerRoom(sessionId));
    socket.join(playerIndividualRoom(playerId));

    // Send the current player state
    const playerState = gameStateManager.getPlayerGameState(sessionId, playerId);
    if (playerState) {
      socket.emit('player:state-update', playerState);
    }

    // Notify the host that this player has reconnected
    socket.to(hostRoom(sessionId)).emit('game:player-reconnected', {
      id: player.id,
      nickname: player.nickname,
    });

    // Also send an updated full game state to the host so the player list
    // reflects the reconnected status.
    const updatedState = gameStateManager.getGameState(sessionId);
    if (updatedState) {
      socket.to(hostRoom(sessionId)).emit('game:state-update', updatedState);
    }

    console.log(
      `[reconnection] Player ${player.nickname} (${playerId}) reconnected to session ${sessionId}`
    );
  } else {
    // ---------- Host reconnection ----------

    // Verify the socket user is actually the host of this session
    if (socket.data.type !== 'host' || socket.data.userId !== session.hostId) {
      socket.emit('error', 'Unauthorized: you are not the host of this session');
      return;
    }

    // Re-join host room
    socket.join(hostRoom(sessionId));

    // Send the full game state to the host
    socket.emit('game:state-update', gameState);

    console.log(
      `[reconnection] Host (${socket.data.userId}) reconnected to session ${sessionId}`
    );
  }
}
