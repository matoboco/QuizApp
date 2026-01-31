import { useState, useCallback, useEffect, useRef } from 'react';
import { usePlayerGameSocket } from '@/socket/useGameSocket';

interface JoinGameResult {
  success: boolean;
  error?: string;
  playerId?: string;
  sessionId?: string;
}

export function usePlayerGame() {
  const {
    socket,
    isConnected,
    playerState,
    error,
    lastResult,
    countdown,
    isKicked,
    joinGame: socketJoinGame,
    submitAnswer: socketSubmitAnswer,
  } = usePlayerGameSocket();

  const [hasJoined, setHasJoined] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | string[] | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Reset selectedAnswer when a new question arrives
  const currentQuestionId = playerState?.currentQuestion?.id ?? null;
  const prevQuestionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentQuestionId !== prevQuestionIdRef.current) {
      prevQuestionIdRef.current = currentQuestionId;
      setSelectedAnswer(null);
    }
  }, [currentQuestionId]);

  const joinGame = useCallback(
    (pin: string, nickname: string): Promise<JoinGameResult> => {
      setIsJoining(true);
      setJoinError(null);

      return new Promise((resolve) => {
        socketJoinGame(pin, nickname, (response) => {
          setIsJoining(false);
          if (response.success) {
            setHasJoined(true);
            setJoinError(null);
          } else {
            setJoinError(response.error ?? 'Failed to join game');
          }
          resolve(response);
        });
      });
    },
    [socketJoinGame]
  );

  const submitAnswer = useCallback(
    (answerId: string | string[]) => {
      if (!playerState) return;
      const questionId = playerState.currentQuestion?.id;
      if (!questionId) return;

      setSelectedAnswer(answerId);
      socketSubmitAnswer(playerState.sessionId, questionId, answerId);
    },
    [playerState, socketSubmitAnswer]
  );

  // Derive the game phase from playerState status
  const gamePhase = playerState?.status ?? null;

  return {
    // Socket state
    socket,
    isConnected,
    playerState,
    error: joinError || error,

    // Convenience state
    hasJoined,
    selectedAnswer,
    currentQuestionId,
    gamePhase,
    lastResult,
    countdown,
    isKicked,
    isJoining,

    // Actions
    joinGame,
    submitAnswer,
    setSelectedAnswer,
  };
}
