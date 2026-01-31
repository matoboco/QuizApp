import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { Toast as ToastData } from '@/context/ToastContext';

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

const borderColors: Record<ToastData['type'], string> = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  warning: 'border-l-yellow-500',
  info: 'border-l-blue-500',
};

const iconBgColors: Record<ToastData['type'], string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

function ToastIcon({ type }: { type: ToastData['type'] }) {
  const className = cn('h-5 w-5 flex-shrink-0', iconBgColors[type]);

  switch (type) {
    case 'success':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      );
    case 'error':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      );
    case 'warning':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    case 'info':
      return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      );
  }
}

export default function Toast({ toast, onRemove }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  const duration = toast.duration ?? 4000;

  // Start fade-out animation near the end of the toast's life
  useEffect(() => {
    if (duration <= 0) return;

    const fadeOutStart = Math.max(duration - 500, 0);
    const timer = setTimeout(() => {
      setIsExiting(true);
    }, fadeOutStart);

    return () => clearTimeout(timer);
  }, [duration]);

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-80 max-w-sm rounded-lg border-l-4 bg-white p-4 shadow-lg',
        borderColors[toast.type],
        isExiting ? 'animate-slide-out-right' : 'animate-slide-in-right'
      )}
      role="alert"
    >
      <ToastIcon type={toast.type} />

      <p className="flex-1 text-sm text-gray-700 leading-snug">{toast.message}</p>

      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
        aria-label="Close notification"
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
