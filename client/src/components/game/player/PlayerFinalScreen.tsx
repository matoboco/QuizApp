import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { formatScore } from '@/lib/utils';
import Button from '@/components/common/Button';

interface PlayerFinalScreenProps {
  rank: number;
  totalScore: number;
  nickname: string;
}

function TrophyIcon({ rank }: { rank: number }) {
  // Colors for top 3 positions
  const colors: Record<number, string> = {
    1: 'text-yellow-400',
    2: 'text-gray-300',
    3: 'text-amber-600',
  };

  if (rank > 3) return null;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-16 h-16 md:w-20 md:h-20', colors[rank] || 'text-yellow-400')}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 00-.584.859 6.753 6.753 0 006.138 5.6 6.73 6.73 0 002.743 1.346A6.707 6.707 0 019.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a.75.75 0 000 1.5h12.17a.75.75 0 000-1.5h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.707 6.707 0 01-1.112-3.173 6.73 6.73 0 002.743-1.347 6.753 6.753 0 006.139-5.6.75.75 0 00-.585-.858 47.077 47.077 0 00-3.07-.543V2.62a.75.75 0 00-.658-.744 49.22 49.22 0 00-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 00-.657.744zm0 2.629c0 3.042 2.139 5.583 4.993 6.204a6.726 6.726 0 01-1.699-2.58 47.28 47.28 0 01-3.294-.544V5.25zm13.668 0v3.074a47.3 47.3 0 01-3.294.544 6.726 6.726 0 01-1.7 2.58 6.252 6.252 0 004.994-6.198z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function getRankMessage(rank: number): string {
  switch (rank) {
    case 1:
      return 'Champion! You crushed it!';
    case 2:
      return 'Amazing! So close to the top!';
    case 3:
      return 'Great job! On the podium!';
    default:
      return 'Well played!';
  }
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export default function PlayerFinalScreen({
  rank,
  totalScore,
  nickname,
}: PlayerFinalScreenProps) {
  const navigate = useNavigate();

  const isTopThree = rank <= 3;

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center px-6 py-8 text-center',
        isTopThree ? 'bg-game-bg' : 'bg-game-bg'
      )}
    >
      {/* Trophy for top 3 */}
      {isTopThree && (
        <div className="mb-4 animate-bounce-in">
          <TrophyIcon rank={rank} />
        </div>
      )}

      {/* Rank display */}
      <div className="animate-bounce-in">
        <p className="text-sky-300 text-lg font-display uppercase tracking-wider mb-1">
          You finished
        </p>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-7xl md:text-8xl font-display font-bold text-white text-shadow-lg">
            #{rank}
          </span>
          <span className="text-2xl md:text-3xl font-display font-bold text-sky-200">
            {getOrdinalSuffix(rank)}
          </span>
        </div>
      </div>

      {/* Player name */}
      <p className="text-xl text-sky-200 mt-3 font-display font-semibold">
        {nickname}
      </p>

      {/* Congratulatory message */}
      <p className="text-white text-lg mt-2 animate-fade-in">
        {getRankMessage(rank)}
      </p>

      {/* Total score */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-5 mt-8 animate-fade-in">
        <p className="text-sky-300 text-sm uppercase tracking-wider mb-1">
          Final Score
        </p>
        <p className="text-4xl md:text-5xl font-display font-bold text-white">
          {formatScore(totalScore)}
        </p>
      </div>

      {/* Play Again button */}
      <Button
        variant="primary"
        size="lg"
        onClick={() => navigate('/play')}
        className="mt-10 text-xl px-10 py-4 rounded-xl"
      >
        Play Again
      </Button>
    </div>
  );
}
