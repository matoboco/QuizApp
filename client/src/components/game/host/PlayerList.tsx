import type { Player } from '@shared/types/game';
import { cn } from '@/lib/utils';

interface PlayerListProps {
  players: Player[];
  onKick?: (playerId: string) => void;
  showKick: boolean;
}

export default function PlayerList({ players, onKick, showKick }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60 text-lg">Waiting for players to join...</div>
        <div className="mt-3 flex justify-center gap-1">
          <span className="inline-block w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="inline-block w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <span className="inline-block w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {players.map((player) => (
        <div
          key={player.id}
          className={cn(
            'relative flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3',
            'border border-white/10 animate-bounce-in transition-all duration-200',
            !player.isConnected && 'opacity-50'
          )}
        >
          {/* Connection dot */}
          <span
            className={cn(
              'flex-shrink-0 w-2.5 h-2.5 rounded-full',
              player.isConnected ? 'bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.6)]' : 'bg-gray-500'
            )}
          />

          {/* Player avatar circle */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm uppercase">
              {player.nickname.charAt(0)}
            </span>
          </div>

          {/* Nickname */}
          <span className="text-white font-semibold text-sm truncate flex-1">
            {player.nickname}
          </span>

          {/* Kick button */}
          {showKick && onKick && (
            <button
              onClick={() => onKick(player.id)}
              className="flex-shrink-0 ml-1 p-1 rounded-full hover:bg-red-500/30 text-white/40 hover:text-red-400 transition-colors"
              title={`Kick ${player.nickname}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
