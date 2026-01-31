import { useMemo } from 'react';
import { useHostGameSocket } from '@/socket/useGameSocket';
import type { GameStatus } from '@shared/types/game';

export function useHostGame(sessionId: string) {
  const socketHook = useHostGameSocket(sessionId);

  const currentPhase: GameStatus | null = useMemo(() => {
    if (!socketHook.gameState) return null;
    return socketHook.gameState.session.status;
  }, [socketHook.gameState]);

  const isLastQuestion = useMemo(() => {
    if (!socketHook.gameState) return false;
    const { currentQuestionIndex } = socketHook.gameState.session;
    const { totalQuestions } = socketHook.gameState;
    return currentQuestionIndex >= totalQuestions - 1;
  }, [socketHook.gameState]);

  return {
    ...socketHook,
    currentPhase,
    isLastQuestion,
  };
}
