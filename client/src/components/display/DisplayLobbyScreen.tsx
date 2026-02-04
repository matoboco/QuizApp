import { QRCodeSVG } from 'qrcode.react';
import type { Player } from '@shared/types/game';

interface DisplayLobbyScreenProps {
  pin: string;
  players: Player[];
}

export default function DisplayLobbyScreen({ pin, players }: DisplayLobbyScreenProps) {
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
                  fgColor="#0f172a"
                  level="M"
                  includeMargin={false}
                />
              </div>
              <p className="text-white/50 text-xs mt-2">Scan to join</p>
            </div>
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
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-white font-display font-bold text-xl">Players</h2>
              <span className="bg-white/20 text-white font-bold px-3 py-1 rounded-full text-sm">
                {connectedCount}
              </span>
            </div>
          </div>

          {/* Player grid (read-only, no kick buttons) */}
          {players.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-lg font-semibold">
                Waiting for players to join...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 border border-white/5 transition-all duration-300 ${
                    !player.isConnected ? 'opacity-40' : 'animate-fade-in'
                  }`}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {player.nickname.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white font-semibold text-sm truncate">
                    {player.nickname}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar — display mode indicator */}
      <div className="flex-shrink-0 px-4 pb-6">
        <div className="max-w-4xl mx-auto flex justify-center">
          <div className="bg-white/10 rounded-xl px-6 py-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
            </svg>
            <span className="text-white/60 font-semibold text-sm">Display Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
}
