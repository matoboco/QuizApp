import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { LeaderboardEntry } from '@shared/types/game';
import { formatScore } from '@/lib/utils';

interface FinalResultsDisplayProps {
  leaderboard: LeaderboardEntry[];
  shareToken?: string;
}

function PodiumPlace({
  entry,
  rank,
  height,
  delay,
}: {
  entry: LeaderboardEntry | undefined;
  rank: number;
  height: string;
  delay: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), parseFloat(delay) * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const colors: Record<number, { gradient: string; bg: string; label: string }> = {
    1: { gradient: 'from-yellow-400 to-yellow-600', bg: 'bg-yellow-400', label: '1st' },
    2: { gradient: 'from-gray-300 to-gray-400', bg: 'bg-gray-300', label: '2nd' },
    3: { gradient: 'from-amber-600 to-amber-800', bg: 'bg-amber-600', label: '3rd' },
  };

  const style = colors[rank] || colors[1];

  if (!entry) {
    return <div className="flex flex-col items-center justify-end" style={{ minWidth: 120 }} />;
  }

  return (
    <div
      className="flex flex-col items-center justify-end transition-all duration-700"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(40px)',
        minWidth: rank === 1 ? 160 : 130,
      }}
    >
      <div
        className={`w-16 h-16 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-3 shadow-lg border-4 border-white/30`}
      >
        <span className="text-white font-display font-bold text-2xl">
          {entry.nickname.charAt(0).toUpperCase()}
        </span>
      </div>

      <p className="text-white font-display font-bold text-lg mb-1 text-center truncate max-w-[140px]">
        {entry.nickname}
      </p>

      <p className="text-white/80 font-bold text-sm mb-3">
        {formatScore(entry.score)} pts
      </p>

      <div
        className={`w-full rounded-t-xl ${style.bg} flex items-center justify-center transition-all duration-700`}
        style={{ height: show ? height : '0px' }}
      >
        <span className="text-white/90 font-display font-black text-2xl">
          {style.label}
        </span>
      </div>
    </div>
  );
}

export default function FinalResultsDisplay({ leaderboard, shareToken }: FinalResultsDisplayProps) {
  const sorted = [...leaderboard].sort((a, b) => a.rank - b.rank);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  const rest = sorted.slice(3);
  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : null;

  return (
    <div className="game-bg flex flex-col">
      {/* Title */}
      <div className="flex-shrink-0 pt-8 pb-4 text-center">
        <h1 className="font-display font-black text-4xl md:text-5xl text-white text-shadow-lg animate-bounce-in">
          Final Results
        </h1>
      </div>

      {/* Podium section */}
      <div className="flex-shrink-0 px-4 pb-6">
        <div className="max-w-2xl mx-auto flex items-end justify-center gap-4">
          <PodiumPlace entry={second} rank={2} height="120px" delay="0.6" />
          <PodiumPlace entry={first} rank={1} height="160px" delay="0.3" />
          <PodiumPlace entry={third} rank={3} height="90px" delay="0.9" />
        </div>
      </div>

      {/* Divider */}
      <div className="flex-shrink-0 px-4">
        <div className="max-w-2xl mx-auto border-t border-white/10" />
      </div>

      {/* Full leaderboard */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {rest.map((entry) => (
            <div
              key={entry.playerId}
              className="flex items-center gap-4 bg-white/10 rounded-xl px-5 py-3 border border-white/5 animate-fade-in"
              style={{ animationDelay: `${1 + entry.rank * 0.1}s`, animationFillMode: 'both' }}
            >
              <span className="flex-shrink-0 w-8 text-white/50 font-display font-bold text-lg text-center">
                #{entry.rank}
              </span>
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {entry.nickname.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="flex-1 text-white font-semibold truncate">
                {entry.nickname}
              </span>
              <span className="flex-shrink-0 text-white/70 font-display font-bold">
                {formatScore(entry.score)}
              </span>
            </div>
          ))}

          {sorted.length === 0 && (
            <p className="text-white/50 text-center py-8">No players participated.</p>
          )}
        </div>
      </div>

      {/* Share QR code */}
      {shareUrl && (
        <div className="flex-shrink-0 px-4 pb-6 pt-4">
          <div className="max-w-2xl mx-auto flex justify-center">
            <div className="bg-white/10 rounded-2xl px-6 py-4 flex items-center gap-5">
              <div className="bg-white rounded-xl p-3">
                <QRCodeSVG
                  value={shareUrl}
                  size={100}
                  bgColor="#ffffff"
                  fgColor="#46178f"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-left">
                <p className="text-white font-display font-bold text-lg">
                  Scan for detailed results
                </p>
                <p className="text-white/50 text-sm mt-1">
                  View scores, answers and stats
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
