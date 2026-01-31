import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  onSubmit: (pin: string) => void;
  error?: string;
  isLoading: boolean;
}

export default function PinInput({ onSubmit, error, isLoading }: PinInputProps) {
  const [pin, setPin] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus on mount
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);

    // Auto-submit when 6 digits are entered
    if (value.length === 6) {
      onSubmit(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && pin.length === 6) {
      onSubmit(pin);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6) {
      onSubmit(pin);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <label
        htmlFor="pin-input"
        className="block text-center text-xl font-display font-bold text-white mb-4"
      >
        Game PIN
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="pin-input"
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
            'w-full text-center text-4xl md:text-5xl font-display font-bold tracking-[0.5em]',
            'py-4 px-6 rounded-xl border-2 bg-white',
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
              className="animate-spin h-6 w-6 text-primary-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-center text-red-300 text-sm font-medium animate-fade-in">
          {error}
        </p>
      )}

      <p className="mt-4 text-center text-purple-200 text-sm">
        Enter the 6-digit PIN shown on the host screen
      </p>
    </form>
  );
}
