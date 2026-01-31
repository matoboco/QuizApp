import React, { useEffect, useState } from 'react';

interface PodiumPlayer {
  nickname: string;
  score: number;
  rank: number;
}

interface PodiumAnimationProps {
  players: PodiumPlayer[];
}

const PODIUM_CONFIG: Record<
  number,
  { color: string; height: number; label: string; medal: string; delay: number }
> = {
  1: { color: '#FFD700', height: 200, label: '1st', medal: '\uD83C\uDFC6', delay: 1200 },
  2: { color: '#C0C0C0', height: 150, label: '2nd', medal: '\uD83E\uDD48', delay: 600 },
  3: { color: '#CD7F32', height: 110, label: '3rd', medal: '\uD83E\uDD49', delay: 0 },
};

const TrophySvg: React.FC<{ rank: number; size?: number }> = ({ rank, size = 32 }) => {
  const colors: Record<number, string> = {
    1: '#FFD700',
    2: '#C0C0C0',
    3: '#CD7F32',
  };
  const fillColor = colors[rank] || '#FFD700';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 3H19V5H20C20.5523 5 21 5.44772 21 6V8C21 9.65685 19.6569 11 18 11H17.9291C17.4439 13.3379 15.5 15.1266 13 15.4725V18H16V21H8V18H11V15.4725C8.5 15.1266 6.55608 13.3379 6.07089 11H6C4.34315 11 3 9.65685 3 8V6C3 5.44772 3.44772 5 4 5H5V3ZM5 7H4V8C4 9.10457 4.89543 10 6 10C5.44772 10 5 9.10457 5 8V7ZM19 7V8C19 9.10457 19 10 18 10C19.1046 10 20 9.10457 20 8V7H19Z"
        fill={fillColor}
      />
      <path
        d="M7 5V10C7 12.7614 9.23858 15 12 15C14.7614 15 17 12.7614 17 10V5H7Z"
        fill={fillColor}
        opacity="0.8"
      />
    </svg>
  );
};

const PodiumColumn: React.FC<{
  player: PodiumPlayer | undefined;
  rank: number;
  isVisible: boolean;
}> = ({ player, rank, isVisible }) => {
  const config = PODIUM_CONFIG[rank];
  if (!config) return null;

  return (
    <div className="flex flex-col items-center justify-end" style={{ minWidth: 120 }}>
      {/* Player info - shown above the podium */}
      <div
        className="mb-2 text-center transition-all duration-700"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
          transitionDelay: '300ms',
        }}
      >
        {player && (
          <>
            <div className="mb-1">
              <TrophySvg rank={rank} size={rank === 1 ? 48 : 36} />
            </div>
            <div className="text-white font-display font-bold text-lg truncate max-w-[140px]">
              {player.nickname}
            </div>
            <div className="text-white/80 font-body text-sm">
              {player.score.toLocaleString()} pts
            </div>
          </>
        )}
      </div>

      {/* Podium bar */}
      <div
        className="relative w-28 rounded-t-lg flex items-center justify-center overflow-hidden"
        style={{
          height: isVisible ? config.height : 0,
          backgroundColor: config.color,
          transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: `0 0 20px ${config.color}40`,
        }}
      >
        {/* Rank label on the podium */}
        <span
          className="font-display font-bold text-2xl transition-opacity duration-500"
          style={{
            color: rank === 1 ? '#7B5800' : rank === 2 ? '#555555' : '#5C3A14',
            opacity: isVisible ? 1 : 0,
            transitionDelay: '500ms',
          }}
        >
          {config.label}
        </span>

        {/* Shine effect */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)`,
          }}
        />
      </div>
    </div>
  );
};

export const PodiumAnimation: React.FC<PodiumAnimationProps> = ({ players }) => {
  const [visibleRanks, setVisibleRanks] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Staggered reveal: 3rd first, then 2nd, then 1st
    const timers: ReturnType<typeof setTimeout>[] = [];

    [3, 2, 1].forEach((rank) => {
      const config = PODIUM_CONFIG[rank];
      if (config) {
        const timer = setTimeout(() => {
          setVisibleRanks((prev) => new Set([...prev, rank]));
        }, config.delay);
        timers.push(timer);
      }
    });

    return () => timers.forEach(clearTimeout);
  }, []);

  const getPlayerByRank = (rank: number): PodiumPlayer | undefined => {
    return players.find((p) => p.rank === rank);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-end justify-center gap-4">
        {/* 2nd place - left */}
        <PodiumColumn
          player={getPlayerByRank(2)}
          rank={2}
          isVisible={visibleRanks.has(2)}
        />

        {/* 1st place - center */}
        <PodiumColumn
          player={getPlayerByRank(1)}
          rank={1}
          isVisible={visibleRanks.has(1)}
        />

        {/* 3rd place - right */}
        <PodiumColumn
          player={getPlayerByRank(3)}
          rank={3}
          isVisible={visibleRanks.has(3)}
        />
      </div>

      {/* Base platform */}
      <div
        className="h-2 rounded-b-lg bg-white/20"
        style={{ width: `${3 * 112 + 2 * 16}px` }}
      />
    </div>
  );
};

export default PodiumAnimation;
