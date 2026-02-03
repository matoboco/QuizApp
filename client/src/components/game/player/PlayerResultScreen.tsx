import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatScore } from '@/lib/utils';
import StreakIndicator from './StreakIndicator';
import type { ScoreBreakdown } from '@shared/types/scoring';

interface PlayerResultScreenProps {
  result: ScoreBreakdown;
  totalScore: number;
  rank?: number;
}

function AnimatedCounter({
  target,
  duration = 800,
  className,
}: {
  target: number;
  duration?: number;
  className?: string;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setCurrent(0);
      return;
    }

    const startTime = Date.now();
    const startValue = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const value = Math.round(startValue + (target - startValue) * eased);
      setCurrent(value);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return <span className={className}>{formatScore(current)}</span>;
}

export default function PlayerResultScreen({
  result,
  totalScore,
  rank,
}: PlayerResultScreenProps) {
  const isCorrect = result.isCorrect;
  const isPartial = !isCorrect && result.correctRatio > 0 && result.correctRatio < 1;
  const hasPoints = result.totalPoints > 0;

  const bgColor = isCorrect ? 'bg-green-600' : isPartial ? 'bg-yellow-600' : 'bg-red-600';
  const iconBg = isCorrect ? 'bg-green-400' : isPartial ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col items-center justify-center px-6 py-8 text-center',
        bgColor
      )}
    >
      {/* Correct / Partial / Incorrect icon */}
      <div
        className={cn(
          'w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center mb-6',
          'animate-bounce-in',
          iconBg
        )}
      >
        {isCorrect ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 md:h-20 md:w-20 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : isPartial ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 md:h-20 md:w-20 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 12H4"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-14 w-14 md:h-20 md:w-20 text-white"
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
        )}
      </div>

      <h1 className="text-3xl md:text-4xl font-display font-bold text-white text-shadow mb-2">
        {isCorrect ? 'Correct!' : isPartial ? 'Partially Correct!' : 'Incorrect'}
      </h1>

      {isPartial && (
        <p className="text-white/80 text-lg mb-2">
          {Math.round(result.correctRatio * 100)}% correct
        </p>
      )}

      {/* Score breakdown */}
      {hasPoints && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 mt-4 mb-4 w-full max-w-xs animate-fade-in">
          <div className="space-y-2 text-white/90 text-sm">
            <div className="flex justify-between">
              <span>Base points</span>
              <span className="font-bold">+{formatScore(result.basePoints)}</span>
            </div>
            {result.timeBonus > 0 && (
              <div className="flex justify-between">
                <span>Time bonus</span>
                <span className="font-bold">+{formatScore(result.timeBonus)}</span>
              </div>
            )}
            {result.exactBonus > 0 && (
              <div className="flex justify-between">
                <span>Exact answer bonus</span>
                <span className="font-bold">+{formatScore(result.exactBonus)}</span>
              </div>
            )}
            {result.streakMultiplier > 1 && (
              <div className="flex justify-between">
                <span>Streak multiplier</span>
                <span className="font-bold">x{result.streakMultiplier.toFixed(1)}</span>
              </div>
            )}
            <div className="border-t border-white/20 pt-2 mt-2 flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-yellow-300">
                +<AnimatedCounter target={result.totalPoints} />
              </span>
            </div>
          </div>
        </div>
      )}

      {!hasPoints && (
        <p className="text-white/80 text-lg mt-2 mb-4">
          Better luck on the next one!
        </p>
      )}

      {/* Streak */}
      {result.streak > 0 && (
        <div className="mb-4">
          <StreakIndicator streak={result.streak} />
        </div>
      )}

      {/* Total score */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 mt-2">
        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
          Total Score
        </p>
        <p className="text-3xl md:text-4xl font-display font-bold text-white">
          <AnimatedCounter target={totalScore} duration={1000} />
        </p>
      </div>

      {/* Rank */}
      {rank !== undefined && (
        <div className="mt-4 text-white/80 text-sm">
          Current rank: <span className="font-bold text-white">#{rank}</span>
        </div>
      )}
    </div>
  );
}
