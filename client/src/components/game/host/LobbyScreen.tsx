import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Player } from '@shared/types/game';
import { useSound } from '@/context/SoundContext';
import Button from '@/components/common/Button';
import PlayerList from './PlayerList';

interface LobbyScreenProps {
  pin: string;
  players: Player[];
  onStart: () => void;
  onKickPlayer: (playerId: string) => void;
  displayCount?: number;
}

export default function LobbyScreen({
  pin,
  players,
  onStart,
  onKickPlayer,
  displayCount = 0,
}: LobbyScreenProps) {
  const { play } = useSound();
  const prevCountRef = useRef(players.length);

  useEffect(() => {
    if (players.length > prevCountRef.current) {
      play('join');
    }
    prevCountRef.current = players.length;
  }, [players.length, play]);

  const joinUrl = `${window.location.origin}/play?pin=${pin}`;
  const connectedCount = players.filter((p) => p.isConnected).length;

  return (
    <div className="game-bg flex flex-col">
      {/* Top section: PIN & QR */}
      <div className="flex-shrink-0 pt-8 pb-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            {/* PIN display */}
            <div className="text-center">
              <p className="text-white/70 text-lg font-semibold uppercase tracking-widest mb-2">
                Game PIN
              </p>
              <div className="bg-white rounded-2xl px-10 py-6 shadow-2xl">
                <span className="font-display font-black text-6xl sm:text-7xl md:text-8xl tracking-[0.3em] text-game-bg select-all">
                  {pin}
                </span>
              </div>
              <p className="text-white/50 text-sm mt-3">
                Go to <span className="text-white font-semibold">{window.location.host}/play</span> and enter this PIN
              </p>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-2xl p-4 shadow-2xl">
                <QRCodeSVG
                  value={joinUrl}
                  size={160}
                  bgColor="#ffffff"
                  fgColor="#0a0a1a"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-white/50 text-xs mt-2">Scan to join</p>
            </div>
          </div>
        </div>
      </div>

      {/* Display info */}
      <div className="flex-shrink-0 px-4 pb-2">
        <div className="max-w-4xl mx-auto flex justify-center">
          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
            </svg>
            {displayCount > 0 ? (
              <span className="text-white/70 text-sm font-semibold">
                {displayCount} display{displayCount !== 1 ? 's' : ''} connected
              </span>
            ) : (
              <span className="text-white/50 text-sm">
                Open <span className="text-white/70 font-semibold">/display</span> on a projector and enter the PIN
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex-shrink-0 px-4">
        <div className="max-w-4xl mx-auto border-t border-white/10" />
      </div>

      {/* Player list section */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Player count header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-display font-bold text-xl">Players</h2>
              <span className="bg-white/20 text-white font-bold px-3 py-1 rounded-full text-sm">
                {connectedCount}
              </span>
            </div>
          </div>

          <PlayerList
            players={players}
            onKick={onKickPlayer}
            showKick={true}
          />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex-shrink-0 px-4 pb-6">
        <div className="max-w-4xl mx-auto flex justify-center">
          <Button
            variant="primary"
            size="lg"
            disabled={connectedCount < 1}
            onClick={onStart}
            className="px-12 py-4 text-xl font-display font-bold bg-neon-green hover:bg-neon-green-light text-cyber-dark focus:ring-neon-green shadow-neon-green disabled:bg-gray-600 disabled:text-gray-400 disabled:shadow-none transition-all duration-200"
          >
            {connectedCount < 1 ? 'Waiting for players...' : `Start Game (${connectedCount} player${connectedCount !== 1 ? 's' : ''})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
