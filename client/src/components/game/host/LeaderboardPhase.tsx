import { useEffect } from 'react';
import type { LeaderboardEntry } from '@shared/types/game';
import { useSound } from '@/context/SoundContext';
import { formatScore } from '@/lib/utils';

interface LeaderboardPhaseProps {
  leaderboard: LeaderboardEntry[];
}

const PODIUM_STYLES: Record<number, { bg: string; border: string; text: string; size: string; delay: string }> = {
  1: {
    bg: 'from-yellow-400/30 to-yellow-600/20',
    border: 'border-yellow-400',
    text: 'text-yellow-300',
    size: 'text-3xl md:text-4xl',
    delay: '0.3s',
  },
  2: {
    bg: 'from-gray-300/30 to-gray-400/20',
    border: 'border-gray-300',
    text: 'text-gray-300',
    size: 'text-2xl md:text-3xl',
    delay: '0.5s',
  },
  3: {
    bg: 'from-amber-700/30 to-amber-800/20',
    border: 'border-amber-600',
    text: 'text-amber-500',
    size: 'text-xl md:text-2xl',
    delay: '0.7s',
  },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return <span className="text-3xl">&#127942;</span>; // trophy emoji as text
  }
  if (rank === 2) {
    return <span className="text-2xl">&#129352;</span>; // 2nd place medal
  }
  if (rank === 3) {
    return <span className="text-2xl">&#129353;</span>; // 3rd place medal
  }
  return (
    <span className="text-white/60 font-display font-bold text-xl">
      #{rank}
    </span>
  );
}

export default function LeaderboardPhase({ leaderboard }: LeaderboardPhaseProps) {
  const { play } = useSound();

  useEffect(() => {
    play('leaderboard');
  }, [play]);

  const top5 = leaderboard.slice(0, 5);

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6">
      <h2 className="font-display font-bold text-3xl md:text-4xl text-white text-shadow-lg mb-8 animate-bounce-in">
        Leaderboard
      </h2>

      <div className="w-full max-w-2xl space-y-3">
        {top5.map((entry) => {
          const isPodium = entry.rank >= 1 && entry.rank <= 3;
          const style = PODIUM_STYLES[entry.rank];

          return (
            <div
              key={entry.playerId}
              className={`
                flex items-center gap-4 rounded-xl px-6 py-4 animate-slide-in
                ${
                  isPodium && style
                    ? `bg-gradient-to-r ${style.bg} border-2 ${style.border}`
                    : 'bg-white/10 border border-white/10'
                }
              `}
              style={{ animationDelay: isPodium && style ? style.delay : `${0.3 + entry.rank * 0.15}s`, animationFillMode: 'both' }}
            >
              {/* Rank */}
              <div className="flex-shrink-0 w-12 flex items-center justify-center">
                <RankBadge rank={entry.rank} />
              </div>

              {/* Player avatar */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                  isPodium
                    ? 'bg-gradient-to-br from-primary-400 to-primary-700'
                    : 'bg-white/20'
                }`}
              >
                {entry.nickname.charAt(0).toUpperCase()}
              </div>

              {/* Nickname */}
              <div className="flex-1 min-w-0">
                <p className={`font-display font-bold truncate ${isPodium && style ? style.size : 'text-lg'} text-white`}>
                  {entry.nickname}
                </p>
                {entry.streak > 0 && (
                  <p className="text-white/50 text-xs font-semibold">
                    {entry.streak} streak
                  </p>
                )}
              </div>

              {/* Score */}
              <div className="flex-shrink-0 text-right">
                <span className={`font-display font-black ${isPodium && style ? style.text + ' ' + style.size : 'text-white text-xl'}`}>
                  {formatScore(entry.score)}
                </span>
                {entry.lastScoreBreakdown && entry.lastScoreBreakdown.totalPoints > 0 && (
                  <div className="text-green-400 text-xs font-bold animate-score-pop">
                    +{formatScore(entry.lastScoreBreakdown.totalPoints)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
