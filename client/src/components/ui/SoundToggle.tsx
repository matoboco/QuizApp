import { useSound } from '@/context/SoundContext';

export default function SoundToggle({ className = '' }: { className?: string }) {
  const { muted, toggleMute } = useSound();

  return (
    <button
      onClick={toggleMute}
      className={`p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all ${className}`}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  );
}
