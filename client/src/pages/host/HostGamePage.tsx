import { useParams, useNavigate } from 'react-router-dom';
import { useHostGame } from '@/hooks/useHostGame';
import LobbyScreen from '@/components/game/host/LobbyScreen';
import GamePresentation from '@/components/game/host/GamePresentation';
import GameControls from '@/components/game/host/GameControls';
import FinalResultsScreen from '@/components/game/host/FinalResultsScreen';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function HostGamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const {
    gameState,
    isConnected,
    error,
    currentPhase,
    isLastQuestion,
    startGame,
    nextQuestion,
    showAnswers,
    showResult,
    showLeaderboard,
    endGame,
    kickPlayer,
  } = useHostGame(sessionId!);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Loading state
  if (!gameState) {
    return (
      <div className="game-bg flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" className="text-white" />
        <p className="text-white/70 mt-4 font-semibold text-lg">
          {!isConnected ? 'Connecting to server...' : 'Loading game...'}
        </p>
        {error && (
          <div className="mt-4 bg-red-500/20 border border-red-500/40 rounded-xl px-6 py-3 max-w-md text-center">
            <p className="text-red-300 font-semibold">{error}</p>
          </div>
        )}
      </div>
    );
  }

  // Error display (with game state available)
  if (error) {
    return (
      <div className="game-bg flex flex-col items-center justify-center">
        <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-8 py-6 max-w-md text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-red-400 mx-auto mb-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <h3 className="text-red-300 font-display font-bold text-xl mb-2">Connection Error</h3>
          <p className="text-red-200/80">{error}</p>
          <button
            onClick={handleBackToDashboard}
            className="mt-4 text-white/70 hover:text-white underline text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Lobby phase
  if (currentPhase === 'lobby') {
    return (
      <LobbyScreen
        pin={gameState.session.pin}
        players={gameState.players}
        onStart={startGame}
        onKickPlayer={kickPlayer}
      />
    );
  }

  // Finished phase
  if (currentPhase === 'finished') {
    return (
      <FinalResultsScreen
        leaderboard={gameState.leaderboard}
        sessionId={sessionId!}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  // Active game phases (starting, question, answers, result, leaderboard)
  return (
    <div className="game-bg relative">
      <GamePresentation
        gameState={gameState}
        handlers={{
          onShowAnswers: showAnswers,
          onShowResult: showResult,
          onShowLeaderboard: showLeaderboard,
          onNextQuestion: nextQuestion,
          onEndGame: endGame,
        }}
      />
      <GameControls
        status={gameState.session.status}
        onShowAnswers={showAnswers}
        onShowResult={showResult}
        onShowLeaderboard={showLeaderboard}
        onNextQuestion={nextQuestion}
        onEndGame={endGame}
        isLastQuestion={isLastQuestion}
      />
    </div>
  );
}
