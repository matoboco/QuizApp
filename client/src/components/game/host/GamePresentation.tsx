import type { GameState } from '@shared/types/game';
import QuestionPhase from './QuestionPhase';
import AnswersPhase from './AnswersPhase';
import ResultPhase from './ResultPhase';
import LeaderboardPhase from './LeaderboardPhase';

interface GamePresentationHandlers {
  onShowAnswers: () => void;
  onShowResult: () => void;
  onShowLeaderboard: () => void;
  onNextQuestion: () => void;
  onEndGame: () => void;
}

interface GamePresentationProps {
  gameState: GameState;
  handlers: GamePresentationHandlers;
}

export default function GamePresentation({
  gameState,
}: GamePresentationProps) {
  const { session, currentQuestion, players, leaderboard, answerDistribution, questionStartedAt, totalQuestions } = gameState;
  const status = session.status;

  const renderPhase = () => {
    switch (status) {
      case 'starting':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center animate-bounce-in">
              <h2 className="font-display font-black text-5xl md:text-7xl text-white text-shadow-lg mb-4">
                Get Ready!
              </h2>
              <p className="text-white/60 text-xl font-semibold">
                The game is about to begin...
              </p>
              <div className="mt-8 flex justify-center gap-2">
                <span className="w-4 h-4 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-4 h-4 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-4 h-4 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            </div>
          </div>
        );

      case 'question':
        if (!currentQuestion) return null;
        return (
          <QuestionPhase
            question={currentQuestion}
            questionIndex={session.currentQuestionIndex}
            totalQuestions={totalQuestions}
            timeLimit={currentQuestion.timeLimit}
            questionStartedAt={questionStartedAt || Date.now()}
          />
        );

      case 'answers': {
        const connectedPlayers = players.filter((p) => p.isConnected).length;
        return (
          <AnswersPhase
            totalAnswered={gameState.answeredCount}
            totalPlayers={connectedPlayers}
          />
        );
      }

      case 'result':
        if (!currentQuestion) return null;
        return (
          <ResultPhase
            question={currentQuestion}
            answerDistribution={answerDistribution || []}
          />
        );

      case 'leaderboard':
        return <LeaderboardPhase leaderboard={leaderboard} />;

      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full relative">
      {renderPhase()}
    </div>
  );
}
