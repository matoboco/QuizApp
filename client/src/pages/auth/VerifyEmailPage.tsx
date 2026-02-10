import { useState, useEffect, FormEvent, useRef } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { resendCodeApi } from '@/api/auth.api';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import Button from '@/components/common/Button';
import { AxiosError } from 'axios';
import type { ApiResponse } from '@shared/types/api';

export default function VerifyEmailPage() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;
  const { verifyEmail, isAuthenticated, isLoading: authLoading } = useAuth();

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  if (authLoading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  if (!email) return <Navigate to="/login" replace />;

  function handleDigitChange(index: number, value: string) {
    if (value.length > 1) {
      // Handle paste of full code
      const pasted = value.replace(/\D/g, '').slice(0, 6);
      if (pasted.length === 6) {
        const newDigits = pasted.split('');
        setDigits(newDigits);
        inputRefs.current[5]?.focus();
        return;
      }
    }

    const digit = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length && i < 6; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await verifyEmail(email!, code);
    } catch (err) {
      const axiosError = err as AxiosError<ApiResponse>;
      setError(
        axiosError.response?.data?.error ||
          axiosError.response?.data?.message ||
          'Verification failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return;
    setResendMessage('');
    setError('');

    try {
      await resendCodeApi({ email: email! });
      setResendMessage('A new code has been sent to your email.');
      setResendCooldown(60);
    } catch {
      setError('Failed to resend code. Please try again.');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cyber-dark px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt={APP_NAME} className="h-16 w-16 mx-auto mb-3" />
          <h1 className="text-3xl font-display font-bold text-primary-400 text-shadow-neon-cyan">
            {APP_NAME}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{APP_TAGLINE}</p>
          <p className="mt-2 text-gray-400">Verify your email address</p>
        </div>

        <div className="card">
          <p className="text-sm text-gray-400 mb-6 text-center">
            We sent a 6-digit code to <span className="font-semibold text-gray-200">{email}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {resendMessage && (
              <div className="bg-neon-green/10 border border-neon-green/30 text-neon-green px-4 py-3 rounded-lg text-sm">
                {resendMessage}
              </div>
            )}

            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleDigitChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-cyber-surface border-2 border-primary-500/30 rounded-lg text-gray-100 focus:border-primary-400 focus:ring-2 focus:ring-primary-500/30 outline-none transition-colors"
                />
              ))}
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Verify Email
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="font-semibold text-primary-400 hover:text-primary-300 disabled:text-gray-500 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
              </button>
            </p>
          </div>

          <p className="mt-4 text-center text-sm text-gray-400">
            <Link
              to="/login"
              className="font-semibold text-primary-400 hover:text-primary-300"
            >
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
