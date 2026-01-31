interface AnswersPhaseProps {
  totalAnswered: number;
  totalPlayers: number;
}

export default function AnswersPhase({
  totalAnswered,
  totalPlayers,
}: AnswersPhaseProps) {
  const allAnswered = totalAnswered >= totalPlayers;
  const fraction = totalPlayers > 0 ? totalAnswered / totalPlayers : 0;

  return (
    <div className="flex flex-col items-center justify-center h-full px-4">
      {/* Header */}
      <h2 className="font-display font-bold text-4xl md:text-5xl text-white text-shadow-lg mb-8 animate-bounce-in">
        {allAnswered ? "All players answered!" : "Time's up!"}
      </h2>

      {/* Answer count ring */}
      <div className="relative mb-8">
        <svg width="200" height="200" className="transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="12"
          />
          <circle
            cx="100"
            cy="100"
            r="85"
            fill="none"
            stroke="#22c55e"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 85}
            strokeDashoffset={2 * Math.PI * 85 * (1 - fraction)}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-black text-5xl text-white">
            {totalAnswered}
          </span>
          <span className="text-white/60 font-semibold text-sm">
            of {totalPlayers}
          </span>
        </div>
      </div>

      {/* Status text */}
      <p className="text-white/70 text-lg font-semibold">
        {allAnswered
          ? 'Everyone has answered!'
          : `${totalAnswered} out of ${totalPlayers} players answered`}
      </p>

      {/* Waiting animation dots */}
      {!allAnswered && (
        <div className="mt-6 flex gap-2">
          <span
            className="w-3 h-3 bg-white/50 rounded-full animate-bounce"
            style={{ animationDelay: '0s' }}
          />
          <span
            className="w-3 h-3 bg-white/50 rounded-full animate-bounce"
            style={{ animationDelay: '0.15s' }}
          />
          <span
            className="w-3 h-3 bg-white/50 rounded-full animate-bounce"
            style={{ animationDelay: '0.3s' }}
          />
        </div>
      )}
    </div>
  );
}
