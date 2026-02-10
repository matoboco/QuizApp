import type { GameStatus } from '@shared/types/game';
import Button from '@/components/common/Button';

interface GameControlsProps {
  status: GameStatus;
  onShowAnswers: () => void;
  onShowResult: () => void;
  onShowLeaderboard: () => void;
  onNextQuestion: () => void;
  onEndGame: () => void;
  isLastQuestion: boolean;
}

export default function GameControls({
  status,
  onShowAnswers,
  onShowResult,
  onShowLeaderboard,
  onNextQuestion,
  onEndGame,
  isLastQuestion,
}: GameControlsProps) {
  let actionButton: React.ReactNode = null;

  switch (status) {
    case 'question':
      actionButton = (
        <Button
          variant="primary"
          size="lg"
          onClick={onShowAnswers}
          className="bg-neon-yellow hover:bg-neon-yellow/80 text-cyber-dark focus:ring-neon-yellow font-display font-bold shadow-neon-yellow"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          End Question Early
        </Button>
      );
      break;

    case 'answers':
      actionButton = (
        <Button
          variant="primary"
          size="lg"
          onClick={onShowResult}
          className="bg-primary-400 hover:bg-primary-300 text-cyber-dark focus:ring-primary-400 font-display font-bold shadow-neon-cyan"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
          Show Results
        </Button>
      );
      break;

    case 'result':
      actionButton = (
        <Button
          variant="primary"
          size="lg"
          onClick={onShowLeaderboard}
          className="bg-neon-purple hover:bg-neon-purple-light text-white focus:ring-neon-purple font-display font-bold shadow-neon-purple"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
          </svg>
          Show Leaderboard
        </Button>
      );
      break;

    case 'leaderboard':
      actionButton = isLastQuestion ? (
        <Button
          variant="primary"
          size="lg"
          onClick={onEndGame}
          className="bg-neon-pink hover:bg-neon-pink-light text-white focus:ring-neon-pink font-display font-bold shadow-neon-pink"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
          </svg>
          End Game
        </Button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          onClick={onNextQuestion}
          className="bg-neon-green hover:bg-neon-green-light text-cyber-dark focus:ring-neon-green font-display font-bold shadow-neon-green"
        >
          Next Question
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </Button>
      );
      break;

    default:
      return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50">
      <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent pt-12 pb-6 px-4">
        <div className="flex justify-center">
          {actionButton}
        </div>
      </div>
    </div>
  );
}
