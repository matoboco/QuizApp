import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import type { AppSocket } from './socket';
import type {
  GameState,
  LeaderboardEntry,
  AnswerDistribution,
  GameStatus,
} from '@shared/types/game';

const DISPLAY_TOKEN_KEY = 'quiz_display_token';

interface DisplayAttachCallback {
  success: boolean;
  error?: string;
  sessionId?: string;
  displayId?: string;
  token?: string;
}

interface UseDisplaySocketReturn {
  socket: AppSocket | null;
  isConnected: boolean;
  gameState: GameState | null;
  error: string | null;
  isAttached: boolean;
  attachDisplay: (
    pin: string,
    callback: (response: DisplayAttachCallback) => void
  ) => void;
}

export function useDisplaySocket(): UseDisplaySocketReturn {
  const [displayToken, setDisplayToken] = useState<string | undefined>(() => {
    return localStorage.getItem(DISPLAY_TOKEN_KEY) ?? undefined;
  });

  const { socket, isConnected, error: socketError } = useSocket(displayToken);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAttached, setIsAttached] = useState(false);

  // Track whether we've received state after reconnect with token
  const hasReceivedState = useRef(false);

  // If we reconnect with a display token and receive state, mark as attached
  useEffect(() => {
    if (displayToken && gameState && !hasReceivedState.current) {
      hasReceivedState.current = true;
      setIsAttached(true);
    }
  }, [displayToken, gameState]);

  // Clear stale display token on socket error
  useEffect(() => {
    if (socketError && displayToken) {
      localStorage.removeItem(DISPLAY_TOKEN_KEY);
      setDisplayToken(undefined);
      setIsAttached(false);
      hasReceivedState.current = false;
    }
  }, [socketError, displayToken]);

  // ---- listeners ----
  useEffect(() => {
    if (!socket) return;

    const onStateUpdate = (state: GameState) => {
      setGameState(state);
    };

    const onPlayerJoined = (player: { id: string; nickname: string }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const exists = prev.players.some((p) => p.id === player.id);
        if (exists) return prev;
        return {
          ...prev,
          players: [
            ...prev.players,
            {
              id: player.id,
              sessionId: prev.session.id,
              nickname: player.nickname,
              score: 0,
              streak: 0,
              isConnected: true,
              joinedAt: new Date().toISOString(),
            },
          ],
        };
      });
    };

    const onPlayerLeft = (playerId: string) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === playerId ? { ...p, isConnected: false } : p
          ),
        };
      });
    };

    const onPlayerReconnected = (player: { id: string; nickname: string }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: prev.players.map((p) =>
            p.id === player.id ? { ...p, isConnected: true } : p
          ),
        };
      });
    };

    const onAnswerDistribution = (distribution: AnswerDistribution[]) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, answerDistribution: distribution };
      });
    };

    const onLeaderboard = (leaderboard: LeaderboardEntry[]) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return { ...prev, leaderboard };
      });
    };

    const onFinished = (leaderboard: LeaderboardEntry[]) => {
      setGameState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          leaderboard,
          session: { ...prev.session, status: 'finished' as GameStatus },
        };
      });
    };

    const onError = (message: string) => {
      setError(message);
    };

    socket.on('game:state-update', onStateUpdate);
    socket.on('game:player-joined', onPlayerJoined);
    socket.on('game:player-left', onPlayerLeft);
    socket.on('game:player-reconnected', onPlayerReconnected);
    socket.on('game:answer-distribution', onAnswerDistribution);
    socket.on('game:leaderboard', onLeaderboard);
    socket.on('game:finished', onFinished);
    socket.on('error', onError);

    return () => {
      socket.off('game:state-update', onStateUpdate);
      socket.off('game:player-joined', onPlayerJoined);
      socket.off('game:player-left', onPlayerLeft);
      socket.off('game:player-reconnected', onPlayerReconnected);
      socket.off('game:answer-distribution', onAnswerDistribution);
      socket.off('game:leaderboard', onLeaderboard);
      socket.off('game:finished', onFinished);
      socket.off('error', onError);
    };
  }, [socket]);

  // ---- attachDisplay ----
  const attachDisplay = useCallback(
    (pin: string, callback: (response: DisplayAttachCallback) => void) => {
      if (!socket) {
        callback({ success: false, error: 'Socket not connected' });
        return;
      }

      socket.emit('display:attach', { pin }, (response) => {
        if (response.success && response.token) {
          localStorage.setItem(DISPLAY_TOKEN_KEY, response.token);
          setIsAttached(true);
        }
        callback(response);
      });
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    gameState,
    error: error || socketError,
    isAttached,
    attachDisplay,
  };
}
