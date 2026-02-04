import { cn } from '@/lib/utils';

interface WaitingScreenProps {
  nickname: string;
  playerCount?: number;
}

const ENCOURAGING_MESSAGES = [
  'Get ready to show what you know!',
  'Time to put your thinking cap on!',
  'May the best player win!',
  'Sharpen those reflexes!',
  'This is going to be fun!',
];

export default function WaitingScreen({
  nickname,
  playerCount,
}: WaitingScreenProps) {
  // Use a stable message based on the nickname
  const messageIndex =
    nickname.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) %
    ENCOURAGING_MESSAGES.length;
  const encouragingMessage = ENCOURAGING_MESSAGES[messageIndex];

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center px-6 text-center">
      {/* Checkmark / joined indicator */}
      <div className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-6 animate-bounce-in">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-white"
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
      </div>

      <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 text-shadow">
        You're in!
      </h1>

      <div className="bg-white/10 backdrop-blur-sm rounded-xl px-8 py-4 mt-4 mb-6">
        <p className="text-sky-200 text-sm uppercase tracking-wider mb-1">
          Playing as
        </p>
        <p className="text-2xl md:text-3xl font-display font-bold text-white">
          {nickname}
        </p>
      </div>

      {/* Pulsing dots waiting indicator */}
      <div className="flex items-center space-x-2 mb-6">
        <p className="text-lg text-sky-200">
          Waiting for the host to start
        </p>
        <span className="flex space-x-1">
          <span
            className={cn(
              'inline-block w-2 h-2 bg-sky-300 rounded-full',
              'animate-bounce'
            )}
            style={{ animationDelay: '0ms' }}
          />
          <span
            className={cn(
              'inline-block w-2 h-2 bg-sky-300 rounded-full',
              'animate-bounce'
            )}
            style={{ animationDelay: '150ms' }}
          />
          <span
            className={cn(
              'inline-block w-2 h-2 bg-sky-300 rounded-full',
              'animate-bounce'
            )}
            style={{ animationDelay: '300ms' }}
          />
        </span>
      </div>

      <p className="text-sky-300 text-sm italic">{encouragingMessage}</p>

      {playerCount !== undefined && playerCount > 0 && (
        <div className="mt-8 bg-white/5 rounded-lg px-6 py-3">
          <p className="text-sky-200 text-sm">
            <span className="font-bold text-white text-lg">{playerCount}</span>{' '}
            {playerCount === 1 ? 'player' : 'players'} in the lobby
          </p>
        </div>
      )}
    </div>
  );
}
