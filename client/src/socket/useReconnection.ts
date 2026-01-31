import { useState, useEffect, useRef, useCallback } from 'react';
import type { AppSocket } from './socket';

// ---------------------------------------------------------------------------
// Session storage keys for reconnection data
// ---------------------------------------------------------------------------
const RECONNECT_SESSION_KEY = 'quiz_reconnect_session';
const RECONNECT_PLAYER_KEY = 'quiz_reconnect_player';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReconnectionInfo {
  sessionId: string;
  playerId?: string;
}

interface UseReconnectionReturn {
  /** Whether a reconnection attempt is currently in progress. */
  isReconnecting: boolean;
  /** The current reconnection attempt number (1-based). */
  reconnectAttempt: number;
  /** Maximum number of reconnection attempts before giving up. */
  maxAttempts: number;
  /** True once all reconnection attempts have been exhausted. */
  isPermanentlyDisconnected: boolean;
  /** Manually clear stored reconnection data (e.g. on intentional leave). */
  clearReconnectionData: () => void;
}

// ---------------------------------------------------------------------------
// Helpers: persist / retrieve / clear reconnection data in sessionStorage
// ---------------------------------------------------------------------------

export function storeReconnectionData(
  sessionId: string,
  playerId?: string
): void {
  try {
    sessionStorage.setItem(RECONNECT_SESSION_KEY, sessionId);
    if (playerId) {
      sessionStorage.setItem(RECONNECT_PLAYER_KEY, playerId);
    } else {
      sessionStorage.removeItem(RECONNECT_PLAYER_KEY);
    }
  } catch {
    // sessionStorage may be unavailable in some contexts; silently ignore.
  }
}

export function getReconnectionData(): ReconnectionInfo | null {
  try {
    const sessionId = sessionStorage.getItem(RECONNECT_SESSION_KEY);
    if (!sessionId) return null;

    const playerId = sessionStorage.getItem(RECONNECT_PLAYER_KEY) ?? undefined;
    return { sessionId, playerId };
  } catch {
    return null;
  }
}

export function clearReconnectionData(): void {
  try {
    sessionStorage.removeItem(RECONNECT_SESSION_KEY);
    sessionStorage.removeItem(RECONNECT_PLAYER_KEY);
  } catch {
    // Silently ignore.
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Manages automatic reconnection to an active game session after a socket
 * disconnect or page refresh.
 *
 * On every socket `connect` event the hook checks whether there is an active
 * session (either provided via parameters or restored from sessionStorage) and
 * emits `reconnect-game` to the server.
 *
 * The hook tracks Socket.IO's built-in reconnection attempts (configured when
 * the socket was created) and exposes the current attempt number plus a
 * permanent-disconnect flag.
 *
 * @param socket    - The active Socket.IO client instance (or null).
 * @param sessionId - The session to reconnect to. Pass undefined when not in a game.
 * @param playerId  - The player id. Omit for host reconnection.
 */
export function useReconnection(
  socket: AppSocket | null,
  sessionId?: string,
  playerId?: string
): UseReconnectionReturn {
  const MAX_ATTEMPTS = 5;

  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [isPermanentlyDisconnected, setIsPermanentlyDisconnected] =
    useState(false);

  // Keep latest values in refs for stable callbacks
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;
  const playerIdRef = useRef(playerId);
  playerIdRef.current = playerId;

  // ------------------------------------------------------------------
  // Persist reconnection data whenever sessionId / playerId change
  // ------------------------------------------------------------------
  useEffect(() => {
    if (sessionId) {
      storeReconnectionData(sessionId, playerId);
    }
  }, [sessionId, playerId]);

  // ------------------------------------------------------------------
  // Emit reconnect-game on (re)connect
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!socket) return;

    /**
     * Called every time the underlying transport reconnects, including the
     * very first connect.  We emit `reconnect-game` only when there is an
     * active session to reconnect to.
     */
    const onConnect = () => {
      // Determine which session to reconnect to: prefer props, fall back to storage.
      let targetSessionId = sessionIdRef.current;
      let targetPlayerId = playerIdRef.current;

      if (!targetSessionId) {
        const stored = getReconnectionData();
        if (stored) {
          targetSessionId = stored.sessionId;
          targetPlayerId = stored.playerId;
        }
      }

      if (!targetSessionId) {
        // Nothing to reconnect to
        setIsReconnecting(false);
        return;
      }

      // Emit the reconnect request
      socket.emit('reconnect-game', {
        sessionId: targetSessionId,
        playerId: targetPlayerId,
      });

      // Reset reconnection tracking on successful connect
      setIsReconnecting(false);
      setReconnectAttempt(0);
      setIsPermanentlyDisconnected(false);
    };

    /**
     * Fired when the socket disconnects (transport loss).
     * Start showing the "reconnecting" UI.
     */
    const onDisconnect = () => {
      // Only mark reconnecting if we have an active session
      if (sessionIdRef.current || getReconnectionData()) {
        setIsReconnecting(true);
      }
    };

    /**
     * Socket.IO emits `reconnect_attempt` with the attempt number (1-based)
     * each time a new reconnection attempt starts.
     */
    const onReconnectAttempt = (attempt: number) => {
      setReconnectAttempt(attempt);
      setIsReconnecting(true);
    };

    /**
     * Fired when Socket.IO has exhausted all reconnection attempts.
     */
    const onReconnectFailed = () => {
      setIsReconnecting(false);
      setIsPermanentlyDisconnected(true);
    };

    // The underlying Engine.IO manager exposes reconnection lifecycle events.
    // Socket.IO v4 surfaces these on `socket.io`.
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect_failed', onReconnectFailed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect_failed', onReconnectFailed);
    };
  }, [socket]);

  // ------------------------------------------------------------------
  // Manual clear helper
  // ------------------------------------------------------------------
  const clearData = useCallback(() => {
    clearReconnectionData();
    setIsReconnecting(false);
    setReconnectAttempt(0);
    setIsPermanentlyDisconnected(false);
  }, []);

  return {
    isReconnecting,
    reconnectAttempt,
    maxAttempts: MAX_ATTEMPTS,
    isPermanentlyDisconnected,
    clearReconnectionData: clearData,
  };
}
