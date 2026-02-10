import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Button from '@/components/common/Button';

interface NicknameInputProps {
  onSubmit: (nickname: string) => void;
  error?: string;
  isLoading: boolean;
}

const MAX_NICKNAME_LENGTH = 30;

const FUN_PLACEHOLDERS = [
  'Enter your name...',
  'What should we call you?',
  'Pick a cool nickname...',
  'Your player name...',
  'Who are you?',
];

export default function NicknameInput({
  onSubmit,
  error,
  isLoading,
}: NicknameInputProps) {
  const [nickname, setNickname] = useState('');
  const [placeholder] = useState(
    () => FUN_PLACEHOLDERS[Math.floor(Math.random() * FUN_PLACEHOLDERS.length)]
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length > 0) {
      onSubmit(trimmed);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, MAX_NICKNAME_LENGTH);
    setNickname(value);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm mx-auto">
      <label
        htmlFor="nickname-input"
        className="block text-center text-xl font-display font-bold text-white mb-4"
      >
        Your Nickname
      </label>

      <input
        ref={inputRef}
        id="nickname-input"
        type="text"
        placeholder={placeholder}
        value={nickname}
        onChange={handleChange}
        disabled={isLoading}
        maxLength={MAX_NICKNAME_LENGTH}
        className={cn(
          'w-full text-center text-2xl md:text-3xl font-display font-bold',
          'py-4 px-6 rounded-xl border-2 bg-cyber-surface text-gray-100',
          'focus:outline-none focus:ring-4 focus:ring-primary-400 focus:border-primary-500',
          'transition-all duration-200 placeholder:text-gray-500',
          error
            ? 'border-red-500 ring-2 ring-red-500/30'
            : 'border-primary-500/30',
          isLoading && 'opacity-60 cursor-not-allowed'
        )}
      />

      {error && (
        <p className="mt-3 text-center text-red-300 text-sm font-medium animate-fade-in">
          {error}
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={nickname.trim().length === 0}
        className="w-full mt-6 text-xl py-4 rounded-xl"
      >
        Join!
      </Button>

      <p className="mt-3 text-center text-primary-300 text-xs">
        {nickname.length}/{MAX_NICKNAME_LENGTH} characters
      </p>
    </form>
  );
}
