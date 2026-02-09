import { io, Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@shared/types/socket-events';
import { SOCKET_URL, SOCKET_PATH } from '@/lib/constants';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/**
 * Creates a new Socket.IO client instance configured for the Quiz App.
 * The socket is created with autoConnect: false so the caller controls
 * when the connection is established.
 *
 * @param token - Optional JWT token for authenticated connections (host or player).
 * @returns A typed Socket.IO client instance.
 */
export function createSocket(token?: string): Socket<ServerToClientEvents, ClientToServerEvents> {
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_URL || undefined, {
    path: SOCKET_PATH,
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      token: token ?? '',
    },
  });

  return socket;
}
