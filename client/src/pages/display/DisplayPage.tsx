import { useEffect, useRef, useState } from 'react';
import { useDisplaySocket } from '@/socket/useDisplaySocket';
import { useSound } from '@/context/SoundContext';
import DisplayAttachForm from '@/components/display/DisplayAttachForm';
import DisplayLobbyScreen from '@/components/display/DisplayLobbyScreen';
import FinalResultsDisplay from '@/components/display/FinalResultsDisplay';
import GamePresentation from '@/components/game/host/GamePresentation';
import SoundToggle from '@/components/ui/SoundToggle';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function DisplayPage() {
  const { play } = useSound();
  const prevStatusRef = useRef<string | null>(null);

  const {
    isConnected,
    gameState,
    error,
    isAttached,
    attachDisplay,
  } = useDisplaySocket();

  const [attachError, setAttachError] = useState<string | undefined>();
  const [isAttaching, setIsAttaching] = useState(false);

  const handleAttach = (pin: string) => {
    if (!/^\d{6}$/.test(pin)) {
      setAttachError('PIN must be 6 digits');
      return;
    }

    setAttachError(undefined);
    setIsAttaching(true);

    attachDisplay(pin, (response) => {
      setIsAttaching(false);
      if (!response.success) {
        setAttachError(response.error ?? 'Failed to connect');
      }
    });
  };

  // Not attached yet — show PIN input form
  if (!isAttached) {
    return (
      <DisplayAttachForm
        onAttach={handleAttach}
        error={attachError ?? (error ?? undefined)}
        isLoading={isAttaching || !isConnected}
      />
    );
  }

  // Attached but waiting for game state
  if (!gameState) {
    return (
      <div className="game-bg flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" className="text-white" />
        <p className="text-white/70 mt-4 font-semibold text-lg">
          Loading game...
        </p>
      </div>
    );
  }

  const status = gameState.session.status;

  // Phase transition sounds
  useEffect(() => {
    if (status === prevStatusRef.current) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!prev) return;
    if (status === 'starting') play('gameStart');
    else if (status === 'question') play('reveal');
    else if (status === 'answers') play('timeUp');
    else if (status === 'finished') play('gameEnd');
  }, [status, play]);

  // Lobby phase
  if (status === 'lobby') {
    return (
      <DisplayLobbyScreen
        pin={gameState.session.pin}
        players={gameState.players}
      />
    );
  }

  // Finished phase
  if (status === 'finished') {
    return (
      <FinalResultsDisplay
        leaderboard={gameState.leaderboard}
        shareToken={gameState.session.shareToken}
      />
    );
  }

  // Active game phases (starting, question, answers, result, leaderboard)
  // Reuse GamePresentation without GameControls
  const noopHandlers = {
    onShowAnswers: () => {},
    onShowResult: () => {},
    onShowLeaderboard: () => {},
    onNextQuestion: () => {},
    onEndGame: () => {},
  };

  return (
    <div className="game-bg relative">
      <div className="absolute top-4 right-4 z-50">
        <SoundToggle />
      </div>
      <GamePresentation
        gameState={gameState}
        handlers={noopHandlers}
      />
    </div>
  );
}
