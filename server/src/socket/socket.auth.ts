import type { Socket } from 'socket.io';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from '@shared/types';
import { authService } from '../auth/auth.service';
import { userRepository } from '../db/repositories';

type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

/**
 * Socket.IO authentication middleware.
 *
 * Validates the JWT token from `socket.handshake.auth.token`.
 * - For host connections: verifies user exists and is active, sets userId and type='host' on socket.data
 * - For player connections: sets playerId, sessionId, and type='player' on socket.data
 * - For anonymous connections (no token): allows connection with type='player' and no IDs
 *   (players who haven't joined yet connect first, then use player:join to get credentials)
 */
export async function socketAuthMiddleware(
  socket: TypedSocket,
  next: (err?: Error) => void
): Promise<void> {
  const token = socket.handshake.auth?.token as string | undefined;

  if (!token) {
    // Allow anonymous connections for players who haven't joined yet
    socket.data = {
      type: 'player',
    };
    return next();
  }

  try {
    const payload = authService.verifyToken(token);

    if (payload.type === 'host') {
      // Verify user still exists and is active
      const user = await userRepository.findById(payload.userId);
      if (!user || !user.isActive) {
        console.warn(`[socket.auth] User ${payload.userId} no longer exists or is inactive`);
        socket.data = { type: 'player' };
        return next();
      }
      socket.data = {
        userId: payload.userId,
        type: 'host',
      };
    } else if (payload.type === 'player') {
      socket.data = {
        playerId: payload.playerId,
        sessionId: payload.sessionId,
        type: 'player',
      };
    } else if (payload.type === 'display') {
      socket.data = {
        displayId: payload.displayId,
        sessionId: payload.sessionId,
        type: 'display',
      };
    } else {
      socket.data = {
        type: 'player',
      };
    }

    return next();
  } catch {
    // Token is invalid or expired – fall back to anonymous player connection
    // rather than rejecting outright. The player can still join a game via
    // the player:join event and will receive a fresh token.
    console.warn(`[socket.auth] Invalid/expired token, allowing anonymous connection for ${socket.id}`);
    socket.data = {
      type: 'player',
    };
    return next();
  }
}
