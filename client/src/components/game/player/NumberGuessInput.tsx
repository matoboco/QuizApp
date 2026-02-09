import { useState } from 'react';
import { useSound } from '@/context/SoundContext';

interface NumberGuessInputProps {
  onSubmit: (value: string) => void;
  disabled: boolean;
  submitted: boolean;
}

export default function NumberGuessInput({ onSubmit, disabled, submitted }: NumberGuessInputProps) {
  const { play } = useSound();
  const [value, setValue] = useState('');

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed === '' || isNaN(Number(trimmed))) return;
    play('submit');
    onSubmit(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled && !submitted) {
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full h-full p-4 md:p-8">
      <div className="w-full max-w-md">
        <label className="block text-white text-lg font-semibold text-center mb-3">
          Enter your guess
        </label>
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || submitted}
          placeholder="Type a number..."
          className="w-full text-center text-3xl font-bold px-6 py-4 rounded-xl border-2 border-white/30 bg-white/10 text-white placeholder-white/50 outline-none focus:border-white/60 focus:bg-white/20 transition-all disabled:opacity-50"
          autoFocus
        />
      </div>
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={disabled || value.trim() === '' || isNaN(Number(value.trim()))}
          className="px-8 py-3 bg-white text-game-bg font-bold text-lg rounded-xl shadow-lg hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Submit
        </button>
      ) : (
        <div className="px-6 py-3 bg-white/20 text-white font-semibold text-lg rounded-xl">
          Answer submitted: {value}
        </div>
      )}
    </div>
  );
}
