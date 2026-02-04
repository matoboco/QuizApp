import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { LeaderboardEntry } from '@shared/types/game';
import { formatScore } from '@/lib/utils';
import Button from '@/components/common/Button';

interface FinalResultsScreenProps {
  leaderboard: LeaderboardEntry[];
  sessionId: string;
  onBackToDashboard: () => void;
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
      {/* Player avatar */}
      <div
        className={`w-16 h-16 rounded-full bg-gradient-to-br ${style.gradient} flex items-center justify-center mb-3 shadow-lg border-4 border-white/30`}
      >
        <span className="text-white font-display font-bold text-2xl">
          {entry.nickname.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Nickname */}
      <p className="text-white font-display font-bold text-lg mb-1 text-center truncate max-w-[140px]">
        {entry.nickname}
      </p>

      {/* Score */}
      <p className="text-white/80 font-bold text-sm mb-3">
        {formatScore(entry.score)} pts
      </p>

      {/* Podium block */}
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

export default function FinalResultsScreen({
  leaderboard,
  sessionId,
  onBackToDashboard,
  shareToken,
}: FinalResultsScreenProps) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(false);
  const shareUrl = shareToken ? `${window.location.origin}/shared/${shareToken}` : null;

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const sorted = [...leaderboard].sort((a, b) => a.rank - b.rank);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];
  const rest = sorted.slice(3);

  return (
    <div className="game-bg flex flex-col">
      {/* Confetti placeholder - sets data attribute for parent to detect */}
      {showConfetti && <div data-confetti="true" className="hidden" />}

      {/* Title */}
      <div className="flex-shrink-0 pt-8 pb-4 text-center">
        <h1 className="font-display font-black text-4xl md:text-5xl text-white text-shadow-lg animate-bounce-in">
          Final Results
        </h1>
      </div>

      {/* Podium section */}
      <div className="flex-shrink-0 px-4 pb-6">
        <div className="max-w-2xl mx-auto flex items-end justify-center gap-4">
          {/* 2nd place */}
          <PodiumPlace entry={second} rank={2} height="120px" delay="0.6" />
          {/* 1st place */}
          <PodiumPlace entry={first} rank={1} height="160px" delay="0.3" />
          {/* 3rd place */}
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
        <div className="flex-shrink-0 px-4 pt-2 pb-2">
          <div className="max-w-2xl mx-auto flex justify-center">
            <div className="bg-white/10 rounded-2xl px-6 py-4 flex items-center gap-5">
              <div className="bg-white rounded-xl p-3">
                <QRCodeSVG
                  value={shareUrl}
                  size={80}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="text-left">
                <p className="text-white font-display font-bold text-base">
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

      {/* Action buttons */}
      <div className="flex-shrink-0 px-4 pb-8 pt-4">
        <div className="max-w-2xl mx-auto flex justify-center gap-4">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate(`/game/${sessionId}/history`)}
            className="px-8 py-4 text-lg font-display font-bold shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            View Details
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={onBackToDashboard}
            className="px-8 py-4 text-lg font-display font-bold shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
