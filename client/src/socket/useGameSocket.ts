import { useState, useEffect, useCallback, useRef } from 'react';
import { useSocket } from './useSocket';
import { useReconnection, storeReconnectionData, clearReconnectionData } from './useReconnection';
import type { AppSocket } from './socket';
import type {
  GameState,
  PlayerGameState,
  LeaderboardEntry,
  AnswerDistribution,
  GameStatus,
} from '@shared/types/game';
import type { ScoreBreakdown } from '@shared/types/scoring';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Player token key stored per-session so players can reconnect
// ---------------------------------------------------------------------------
const PLAYER_TOKEN_KEY = 'quiz_player_token';

// ---------------------------------------------------------------------------
// useHostGameSocket
// ---------------------------------------------------------------------------

interface UseHostGameSocketReturn {
  socket: AppSocket | null;
  isConnected: boolean;
  gameState: GameState | null;
  error: string | null;
  isReconnecting: boolean;
  reconnectAttempt: number;
  maxAttempts: number;
  isPermanentlyDisconnected: boolean;
  startGame: () => void;
  nextQuestion: () => void;
  showAnswers: () => void;
  showResult: () => void;
  showLeaderboard: () => void;
  endGame: () => void;
  kickPlayer: (playerId: string) => void;
}

/**
 * Hook for the quiz host. Connects with the host's auth token and listens
 * to all host-facing server events for the given session.
 */
export function useHostGameSocket(sessionId: string): UseHostGameSocketReturn {
  const token = localStorage.getItem(AUTH_TOKEN_KEY) ?? undefined;
  const { socket, isConnected, error: socketError } = useSocket(token);

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reconnection support
  const {
    isReconnecting,
    reconnectAttempt,
    maxAttempts,
    isPermanentlyDisconnected,
  } = useReconnection(socket, sessionId);

  // Persist host reconnection data so page refresh can recover
  useEffect(() => {
    if (sessionId) {
      storeReconnectionData(sessionId);
    }
  }, [sessionId]);

  // Keep sessionId in a ref so callbacks always see the latest value
  const sessionIdRef = useRef(sessionId);
  sessionIdRef.current = sessionId;

  // ---- listeners ----
  useEffect(() => {
    if (!socket) return;

    const onStateUpdate = (state: GameState) => {
      setGameState(state);
    };

    const onPlayerJoined = (player: { id: string; nickname: string }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        // Only add if not already in the list
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

    const onPlayerAnswered = (_data: {
      playerId: string;
      totalAnswered: number;
      totalPlayers: number;
    }) => {
      // The host can use this for progress indicators; the full state-update
      // will follow from the server, so we intentionally don't mutate state here.
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
    socket.on('game:player-answered', onPlayerAnswered);
    socket.on('game:answer-distribution', onAnswerDistribution);
    socket.on('game:leaderboard', onLeaderboard);
    socket.on('game:finished', onFinished);
    socket.on('error', onError);

    return () => {
      socket.off('game:state-update', onStateUpdate);
      socket.off('game:player-joined', onPlayerJoined);
      socket.off('game:player-left', onPlayerLeft);
      socket.off('game:player-reconnected', onPlayerReconnected);
      socket.off('game:player-answered', onPlayerAnswered);
      socket.off('game:answer-distribution', onAnswerDistribution);
      socket.off('game:leaderboard', onLeaderboard);
      socket.off('game:finished', onFinished);
      socket.off('error', onError);
    };
  }, [socket]);

  // ---- emit helpers ----
  const startGame = useCallback(() => {
    socket?.emit('host:start-game', sessionIdRef.current);
  }, [socket]);

  const nextQuestion = useCallback(() => {
    socket?.emit('host:next-question', sessionIdRef.current);
  }, [socket]);

  const showAnswers = useCallback(() => {
    socket?.emit('host:show-answers', sessionIdRef.current);
  }, [socket]);

  const showResult = useCallback(() => {
    socket?.emit('host:show-result', sessionIdRef.current);
  }, [socket]);

  const showLeaderboard = useCallback(() => {
    socket?.emit('host:show-leaderboard', sessionIdRef.current);
  }, [socket]);

  const endGame = useCallback(() => {
    socket?.emit('host:end-game', sessionIdRef.current);
  }, [socket]);

  const kickPlayer = useCallback(
    (playerId: string) => {
      socket?.emit('host:kick-player', {
        sessionId: sessionIdRef.current,
        playerId,
      });
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    gameState,
    error: error || socketError,
    isReconnecting,
    reconnectAttempt,
    maxAttempts,
    isPermanentlyDisconnected,
    startGame,
    nextQuestion,
    showAnswers,
    showResult,
    showLeaderboard,
    endGame,
    kickPlayer,
  };
}

// ---------------------------------------------------------------------------
// usePlayerGameSocket
// ---------------------------------------------------------------------------

interface JoinGameCallback {
  success: boolean;
  error?: string;
  playerId?: string;
  sessionId?: string;
}

interface UsePlayerGameSocketReturn {
  socket: AppSocket | null;
  isConnected: boolean;
  playerState: PlayerGameState | null;
  error: string | null;
  lastResult: ScoreBreakdown | null;
  countdown: number | null;
  isKicked: boolean;
  isReconnecting: boolean;
  reconnectAttempt: number;
  maxAttempts: number;
  isPermanentlyDisconnected: boolean;
  joinGame: (
    pin: string,
    nickname: string,
    callback: (response: JoinGameCallback) => void
  ) => void;
  submitAnswer: (sessionId: string, questionId: string, answerId: string) => void;
}

/**
 * Hook for a quiz player. Players may not have a token initially (they get one
 * after joining a game). The hook manages storing the player token and
 * reconnecting the socket with it once available.
 */
export function usePlayerGameSocket(): UsePlayerGameSocketReturn {
  // Attempt to restore a previous player token (for reconnect scenarios)
  const [playerToken, setPlayerToken] = useState<string | undefined>(() => {
    return localStorage.getItem(PLAYER_TOKEN_KEY) ?? undefined;
  });

  const { socket, isConnected, error: socketError } = useSocket(playerToken);

  const [playerState, setPlayerState] = useState<PlayerGameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ScoreBreakdown | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isKicked, setIsKicked] = useState(false);

  // Track sessionId and playerId for reconnection
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(
    () => {
      try {
        return sessionStorage.getItem('quiz_reconnect_session') ?? undefined;
      } catch {
        return undefined;
      }
    }
  );
  const [activePlayerId, setActivePlayerId] = useState<string | undefined>(
    () => {
      try {
        return sessionStorage.getItem('quiz_reconnect_player') ?? undefined;
      } catch {
        return undefined;
      }
    }
  );

  // Clear stale player token if the socket connection fails with an auth error.
  // This lets the socket reconnect anonymously so the player can join a new game.
  useEffect(() => {
    if (socketError && playerToken) {
      localStorage.removeItem(PLAYER_TOKEN_KEY);
      setPlayerToken(undefined);
    }
  }, [socketError, playerToken]);

  // Reconnection support
  const {
    isReconnecting,
    reconnectAttempt,
    maxAttempts,
    isPermanentlyDisconnected,
    clearReconnectionData: clearReconnect,
  } = useReconnection(socket, activeSessionId, activePlayerId);

  // ---- listeners ----
  useEffect(() => {
    if (!socket) return;

    const onStateUpdate = (state: PlayerGameState) => {
      setPlayerState(state);
    };

    const onQuestion = (data: {
      id: string;
      text: string;
      imageUrl?: string;
      timeLimit: number;
      answers: { id: string; text: string; orderIndex: number }[];
      questionIndex: number;
      totalQuestions: number;
    }) => {
      setPlayerState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentQuestion: {
            id: data.id,
            text: data.text,
            imageUrl: data.imageUrl,
            timeLimit: data.timeLimit,
            answers: data.answers,
          },
          currentQuestionIndex: data.questionIndex,
          totalQuestions: data.totalQuestions,
          hasAnswered: false,
          status: 'question' as GameStatus,
        };
      });
      // Reset countdown and last result when a new question arrives
      setLastResult(null);
      setCountdown(data.timeLimit);
    };

    const onAnswerResult = (result: ScoreBreakdown) => {
      setLastResult(result);
      setPlayerState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          hasAnswered: true,
          lastResult: result,
          player: {
            ...prev.player,
            score: prev.player.score + result.totalPoints,
            streak: result.streak,
          },
        };
      });
    };

    const onGameStatus = (status: GameStatus) => {
      setPlayerState((prev) => {
        if (!prev) return prev;
        return { ...prev, status };
      });
    };

    const onKicked = () => {
      setIsKicked(true);
      setPlayerState(null);
      localStorage.removeItem(PLAYER_TOKEN_KEY);
      clearReconnectionData();
      setActiveSessionId(undefined);
      setActivePlayerId(undefined);
    };

    const onGameFinished = (data: {
      rank: number;
      totalScore: number;
      leaderboard: LeaderboardEntry[];
    }) => {
      setPlayerState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'finished' as GameStatus,
          finalRank: data.rank,
          leaderboard: data.leaderboard,
          player: {
            ...prev.player,
            score: data.totalScore,
          },
        };
      });
    };

    const onError = (message: string) => {
      setError(message);
    };

    const onCountdown = (seconds: number) => {
      setCountdown(seconds);
    };

    const onTimeUp = () => {
      setCountdown(0);
    };

    socket.on('player:state-update', onStateUpdate);
    socket.on('player:question', onQuestion);
    socket.on('player:answer-result', onAnswerResult);
    socket.on('player:game-status', onGameStatus);
    socket.on('player:kicked', onKicked);
    socket.on('player:game-finished', onGameFinished);
    socket.on('error', onError);
    socket.on('game:countdown', onCountdown);
    socket.on('game:time-up', onTimeUp);

    return () => {
      socket.off('player:state-update', onStateUpdate);
      socket.off('player:question', onQuestion);
      socket.off('player:answer-result', onAnswerResult);
      socket.off('player:game-status', onGameStatus);
      socket.off('player:kicked', onKicked);
      socket.off('player:game-finished', onGameFinished);
      socket.off('error', onError);
      socket.off('game:countdown', onCountdown);
      socket.off('game:time-up', onTimeUp);
    };
  }, [socket]);

  // ---- joinGame ----
  const joinGame = useCallback(
    (
      pin: string,
      nickname: string,
      callback: (response: JoinGameCallback) => void
    ) => {
      if (!socket) {
        callback({ success: false, error: 'Socket not connected' });
        return;
      }

      socket.emit('player:join', { pin, nickname }, (response) => {
        if (response.success && response.playerId) {
          // Store the JWT token for reconnection on page refresh.
          // We do NOT call setPlayerToken here because that would tear
          // down the current socket (which is already in the right rooms).
          // The token is only needed if the page is refreshed.
          if (response.token) {
            localStorage.setItem(PLAYER_TOKEN_KEY, response.token);
          }

          // Store reconnection data for page refresh recovery
          if (response.sessionId) {
            setActiveSessionId(response.sessionId);
            setActivePlayerId(response.playerId);
            storeReconnectionData(response.sessionId, response.playerId);
          }
        }
        callback(response);
      });
    },
    [socket]
  );

  // ---- submitAnswer ----
  const submitAnswer = useCallback(
    (sessionId: string, questionId: string, answerId: string) => {
      if (!socket) return;
      socket.emit('player:submit-answer', { sessionId, questionId, answerId });
      setPlayerState((prev) => {
        if (!prev) return prev;
        return { ...prev, hasAnswered: true };
      });
    },
    [socket]
  );

  return {
    socket,
    isConnected,
    playerState,
    error: error || socketError,
    lastResult,
    countdown,
    isKicked,
    isReconnecting,
    reconnectAttempt,
    maxAttempts,
    isPermanentlyDisconnected,
    joinGame,
    submitAnswer,
  };
}
