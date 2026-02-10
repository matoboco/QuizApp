import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePlayerGame } from '@/hooks/usePlayerGame';
import PinInput from '@/components/game/player/PinInput';
import NicknameInput from '@/components/game/player/NicknameInput';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { cn } from '@/lib/utils';

type JoinStep = 'pin' | 'nickname';

export default function PlayerJoinPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const {
    isConnected,
    error,
    joinGame,
    isJoining,
  } = usePlayerGame();

  const [step, setStep] = useState<JoinStep>('pin');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | undefined>();
  const [nicknameError, setNicknameError] = useState<string | undefined>();
  const [isPinValidating, setIsPinValidating] = useState(false);

  // Pre-fill PIN from URL query param (from QR code)
  useEffect(() => {
    const urlPin = searchParams.get('pin');
    if (urlPin && /^\d{6}$/.test(urlPin)) {
      setPin(urlPin);
      // Automatically move to nickname step if PIN is from QR
      setStep('nickname');
    }
  }, [searchParams]);

  const handlePinSubmit = (inputPin: string) => {
    // Basic validation: must be 6 digits
    if (!/^\d{6}$/.test(inputPin)) {
      setPinError('PIN must be 6 digits');
      return;
    }

    setPinError(undefined);
    setIsPinValidating(true);

    // For now, we accept the PIN and proceed to nickname step.
    // The actual PIN validation happens when joining with a nickname.
    // This provides a snappier UX. Full validation occurs server-side on join.
    setTimeout(() => {
      setPin(inputPin);
      setStep('nickname');
      setIsPinValidating(false);
    }, 300);
  };

  const handleNicknameSubmit = async (nickname: string) => {
    setNicknameError(undefined);

    const result = await joinGame(pin, nickname);

    if (result.success && result.sessionId) {
      navigate(`/play/${result.sessionId}`);
    } else {
      // If error relates to PIN (e.g., "Game not found"), go back to PIN step
      const errMsg = result.error ?? 'Failed to join';
      if (
        errMsg.toLowerCase().includes('pin') ||
        errMsg.toLowerCase().includes('not found') ||
        errMsg.toLowerCase().includes('game')
      ) {
        setPinError(errMsg);
        setStep('pin');
      } else {
        setNicknameError(errMsg);
      }
    }
  };

  const handleBackToPin = () => {
    setStep('pin');
    setPinError(undefined);
    setNicknameError(undefined);
  };

  return (
    <div className="min-h-screen bg-game-bg flex flex-col items-center justify-center px-6 py-8">
      {/* App logo / title */}
      <div className="mb-10 text-center animate-fade-in">
        <img src={`${import.meta.env.BASE_URL}logo.svg`} alt={APP_NAME} className="h-20 w-20 mx-auto mb-3" />
        <h1 className="text-5xl md:text-6xl font-display font-bold text-white text-shadow-lg">
          {APP_NAME}
        </h1>
        <p className="text-sky-300 mt-2 text-lg">
          {APP_TAGLINE}
        </p>
      </div>

      {/* Connection status */}
      {!isConnected && (
        <div className="mb-6 px-4 py-2 bg-yellow-500/20 border border-yellow-400/30 rounded-lg animate-fade-in">
          <p className="text-yellow-200 text-sm flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
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
            Connecting to server...
          </p>
        </div>
      )}

      {/* Join card */}
      <div
        className={cn(
          'w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-8',
          'animate-slide-up'
        )}
      >
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              step === 'pin'
                ? 'bg-primary-500 text-white'
                : 'bg-green-500 text-white'
            )}
          >
            {step === 'nickname' ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
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
            ) : (
              '1'
            )}
          </div>
          <div className="w-12 h-0.5 bg-white/20" />
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              step === 'nickname'
                ? 'bg-primary-500 text-white'
                : 'bg-white/20 text-white/50'
            )}
          >
            2
          </div>
        </div>

        {step === 'pin' && (
          <PinInput
            onSubmit={handlePinSubmit}
            error={pinError}
            isLoading={isPinValidating || !isConnected}
          />
        )}

        {step === 'nickname' && (
          <>
            <NicknameInput
              onSubmit={handleNicknameSubmit}
              error={nicknameError || (error ?? undefined)}
              isLoading={isJoining}
            />
            <button
              onClick={handleBackToPin}
              className="mt-4 w-full text-center text-sky-300 hover:text-white text-sm transition-colors"
            >
              &larr; Change PIN ({pin})
            </button>
          </>
        )}
      </div>
    </div>
  );
}
