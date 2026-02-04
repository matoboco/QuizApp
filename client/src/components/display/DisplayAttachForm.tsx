import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DisplayAttachFormProps {
  onAttach: (pin: string) => void;
  error?: string;
  isLoading: boolean;
}

export default function DisplayAttachForm({ onAttach, error, isLoading }: DisplayAttachFormProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);

    if (value.length === 6) {
      onAttach(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pin.length === 6) {
      onAttach(pin);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      onAttach(pin);
    }
  };

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center px-6 py-8">
      <div className="mb-10 text-center animate-fade-in">
        <div className="mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
          </svg>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white text-shadow-lg">
          Remote Display
        </h1>
        <p className="text-sky-300 mt-2 text-lg">
          Enter the game PIN to mirror the host screen
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white/10 backdrop-blur-sm rounded-2xl p-8 animate-slide-up"
      >
        <label
          htmlFor="display-pin-input"
          className="block text-center text-2xl font-display font-bold text-white mb-6"
        >
          Game PIN
        </label>

        <div className="relative">
          <input
            ref={inputRef}
            id="display-pin-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            placeholder="000000"
            value={pin}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            maxLength={6}
            className={cn(
              'w-full text-center text-5xl md:text-6xl font-display font-bold tracking-[0.5em]',
              'py-5 px-6 rounded-xl border-2 bg-white',
              'focus:outline-none focus:ring-4 focus:ring-primary-400 focus:border-primary-500',
              'transition-all duration-200 placeholder:text-gray-300 placeholder:tracking-[0.5em]',
              error
                ? 'border-red-500 ring-2 ring-red-300'
                : 'border-gray-200',
              isLoading && 'opacity-60 cursor-not-allowed'
            )}
          />

          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg
                className="animate-spin h-8 w-8 text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-4 text-center text-red-300 text-base font-medium animate-fade-in">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-sky-200 text-base">
          Enter the 6-digit PIN displayed on the host screen
        </p>
      </form>
    </div>
  );
}
