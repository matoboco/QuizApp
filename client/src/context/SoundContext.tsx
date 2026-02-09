import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { soundEngine, type SoundName } from '@/lib/sound-engine';

interface SoundContextValue {
  play: (name: SoundName) => void;
  muted: boolean;
  toggleMute: () => void;
}

const SoundContext = createContext<SoundContextValue>({
  play: () => {},
  muted: false,
  toggleMute: () => {},
});

export function SoundProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(soundEngine.muted);

  const toggleMute = useCallback(() => {
    const next = !soundEngine.muted;
    soundEngine.muted = next;
    setMuted(next);
  }, []);

  const play = useCallback((name: SoundName) => {
    soundEngine.play(name);
  }, []);

  return (
    <SoundContext.Provider value={{ play, muted, toggleMute }}>
      {children}
    </SoundContext.Provider>
  );
}

export const useSound = () => useContext(SoundContext);
