import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerGame } from '@/hooks/usePlayerGame';
import { useSound } from '@/context/SoundContext';
import WaitingScreen from '@/components/game/player/WaitingScreen';
import AnswerGrid from '@/components/game/player/AnswerGrid';
import PlayerResultScreen from '@/components/game/player/PlayerResultScreen';
import PlayerFinalScreen from '@/components/game/player/PlayerFinalScreen';
import StreakIndicator from '@/components/game/player/StreakIndicator';
import SoundToggle from '@/components/ui/SoundToggle';
import { cn } from '@/lib/utils';

function ReconnectingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-game-surface rounded-xl p-8 text-center animate-fade-in">
        <svg
          className="animate-spin h-10 w-10 text-primary-400 mx-auto mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-white font-display font-bold text-lg">Reconnecting...</p>
        <p className="text-sky-300 text-sm mt-1">Please wait</p>
      </div>
    </div>
  );
}

function KickedScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-red-700 flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center mb-6 animate-bounce-in">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-display font-bold text-white mb-2">
        You've been removed
      </h1>
      <p className="text-red-200 mb-8">
        The host removed you from the game.
      </p>
      <button
        onClick={onBack}
        className="btn-primary text-lg px-8 py-3 rounded-xl"
      >
        Back to Join
      </button>
    </div>
  );
}

function CountdownDisplay({ seconds }: { seconds: number }) {
  const isUrgent = seconds <= 5;

  return (
    <div
      className={cn(
        'flex items-center justify-center',
        'w-16 h-16 rounded-full font-display font-bold text-2xl',
        isUrgent
          ? 'bg-red-500 text-white animate-pulse'
          : 'bg-white/20 text-white'
      )}
    >
      {seconds}
    </div>
  );
}

function WaitingForResultsScreen({ selectedId }: { selectedId?: string | string[] | null }) {
  // Find the color of the selected answer for visual feedback
  // We don't know the orderIndex here, so just show a generic screen
  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center px-6 text-center">
      {selectedId ? (
        <>
          <div className="w-20 h-20 rounded-full bg-primary-500 flex items-center justify-center mb-6 animate-pulse-slow">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Answer submitted!
          </h2>
          <p className="text-sky-300">
            Waiting for all players to answer...
          </p>
        </>
      ) : (
        <>
          <div className="w-20 h-20 rounded-full bg-gray-500 flex items-center justify-center mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-white mb-2">
            Time's up!
          </h2>
          <p className="text-sky-300">
            Waiting for results...
          </p>
        </>
      )}

      {/* Pulsing dots */}
      <div className="flex space-x-1 mt-6">
        <span
          className="inline-block w-2 h-2 bg-sky-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="inline-block w-2 h-2 bg-sky-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="inline-block w-2 h-2 bg-sky-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </div>
    </div>
  );
}

function LeaderboardWaitScreen({ rank, score, streak }: { rank?: number; score: number; streak: number }) {
  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center px-6 text-center">
      {rank !== undefined && (
        <div className="mb-4 animate-bounce-in">
          <p className="text-sky-300 text-sm uppercase tracking-wider">Your rank</p>
          <p className="text-6xl font-display font-bold text-white text-shadow">
            #{rank}
          </p>
        </div>
      )}

      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 mb-6">
        <p className="text-sky-300 text-xs uppercase tracking-wider mb-1">Score</p>
        <p className="text-3xl font-display font-bold text-white">
          {score.toLocaleString()}
        </p>
      </div>

      {streak > 0 && (
        <div className="mb-6">
          <StreakIndicator streak={streak} />
        </div>
      )}

      <p className="text-sky-200 text-lg flex items-center gap-2">
        Next question coming
        <span className="flex space-x-1">
          <span
            className="inline-block w-2 h-2 bg-sky-300 rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="inline-block w-2 h-2 bg-sky-300 rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="inline-block w-2 h-2 bg-sky-300 rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </span>
      </p>
    </div>
  );
}

export default function PlayerGamePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { play } = useSound();
  const prevStatusRef = useRef<string | null>(null);

  const {
    isConnected,
    playerState,
    selectedAnswer,
    lastResult,
    countdown,
    isKicked,
    submitAnswer,
  } = usePlayerGame();

  // Phase transition sounds
  useEffect(() => {
    if (!playerState) return;
    const { status } = playerState;
    if (status === prevStatusRef.current) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = status;
    if (!prev) return;
    if (status === 'starting') play('gameStart');
    else if (status === 'question') play('reveal');
    else if (status === 'answers') play('timeUp');
    else if (status === 'finished') play('gameEnd');
  }, [playerState?.status, play]);

  // Kicked sound
  useEffect(() => {
    if (isKicked) play('kicked');
  }, [isKicked, play]);

  // If kicked, show kicked screen
  if (isKicked) {
    return <KickedScreen onBack={() => navigate('/play')} />;
  }

  // If not connected, show reconnecting overlay on top of current content
  const showReconnecting = !isConnected && playerState !== null;

  // If no player state yet (haven't joined / still loading), show loading
  if (!playerState) {
    return (
      <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center px-6 text-center">
        {showReconnecting || !isConnected ? (
          <>
            <svg
              className="animate-spin h-12 w-12 text-primary-400 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-white font-display font-bold text-xl">
              Connecting to game...
            </p>
            <p className="text-sky-300 text-sm mt-2">
              Please wait while we connect you
            </p>
          </>
        ) : (
          <>
            <p className="text-white font-display font-bold text-xl mb-4">
              Loading game...
            </p>
            <button
              onClick={() => navigate('/play')}
              className="text-sky-300 hover:text-white text-sm underline transition-colors"
            >
              Back to join page
            </button>
          </>
        )}
      </div>
    );
  }

  const { status, player, currentQuestion, hasAnswered, finalRank, leaderboard } = playerState;

  // Find player rank from leaderboard
  const currentRank = leaderboard?.find((e) => e.playerId === player.id)?.rank;

  // Render based on game status
  const renderContent = () => {
    switch (status) {
      case 'lobby':
      case 'starting':
        return (
          <WaitingScreen
            nickname={player.nickname}
          />
        );

      case 'question':
        return (
          <div className="min-h-screen bg-game-surface flex flex-col">
            {/* Top bar with question info and countdown */}
            <div className="flex items-center justify-between px-4 py-3 bg-game-bg">
              <div className="text-white text-sm font-display">
                <span className="font-bold">
                  Q{playerState.currentQuestionIndex + 1}
                </span>
                <span className="text-sky-300">
                  /{playerState.totalQuestions}
                </span>
              </div>

              {countdown !== null && (
                <CountdownDisplay seconds={countdown} />
              )}

              {player.streak > 0 && (
                <StreakIndicator streak={player.streak} />
              )}
            </div>

            {/* Question text */}
            {currentQuestion && (
              <div className="px-4 py-3 bg-game-bg border-b border-white/10">
                <h2 className="text-white font-display font-bold text-lg md:text-xl text-center leading-snug">
                  {currentQuestion.text}
                </h2>
                {currentQuestion.description && (
                  <p className="mt-1 text-white/70 text-sm md:text-base text-center">
                    {currentQuestion.description}
                  </p>
                )}
                {currentQuestion.imageUrl && (
                  <div className="mt-3 flex justify-center">
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="max-h-40 rounded-lg object-contain"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Answer grid */}
            <div className="flex-1 flex items-stretch">
              {currentQuestion && (
                <AnswerGrid
                  answers={currentQuestion.answers}
                  questionType={currentQuestion.questionType}
                  requireAll={currentQuestion.requireAll}
                  onSelect={submitAnswer}
                  selectedId={selectedAnswer ?? undefined}
                  disabled={hasAnswered}
                />
              )}
            </div>
          </div>
        );

      case 'answers':
        return <WaitingForResultsScreen selectedId={selectedAnswer} />;

      case 'result':
        if (lastResult) {
          return (
            <PlayerResultScreen
              result={lastResult}
              totalScore={player.score}
              rank={currentRank}
              correctNumber={currentQuestion?.correctNumber}
              tolerance={currentQuestion?.tolerance}
            />
          );
        }
        // Fallback if no result yet
        return <WaitingForResultsScreen selectedId={selectedAnswer} />;

      case 'leaderboard':
        return (
          <LeaderboardWaitScreen
            rank={currentRank}
            score={player.score}
            streak={player.streak}
          />
        );

      case 'finished':
        return (
          <PlayerFinalScreen
            rank={finalRank ?? currentRank ?? 0}
            totalScore={player.score}
            nickname={player.nickname}
          />
        );

      default:
        return (
          <div className="min-h-screen bg-game-bg flex items-center justify-center">
            <p className="text-white font-display">Loading...</p>
          </div>
        );
    }
  };

  return (
    <div className="relative">
      {showReconnecting && <ReconnectingOverlay />}
      <div className="absolute top-4 right-4 z-50">
        <SoundToggle />
      </div>
      {renderContent()}
    </div>
  );
}
