import { cn } from '@/lib/utils';
import { useSound } from '@/context/SoundContext';
import type { AnswerShape } from '@shared/types/quiz';

interface AnswerButtonProps {
  text: string;
  color: string;
  shape: AnswerShape;
  isSelected: boolean;
  isDisabled: boolean;
  onClick: () => void;
  index: number;
}

function ShapeIcon({ shape, className }: { shape: AnswerShape; className?: string }) {
  const iconClass = cn('w-8 h-8 md:w-10 md:h-10 flex-shrink-0', className);

  switch (shape) {
    case 'triangle':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <polygon points="20,4 36,36 4,36" />
        </svg>
      );
    case 'diamond':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <polygon points="20,2 38,20 20,38 2,20" />
        </svg>
      );
    case 'circle':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <circle cx="20" cy="20" r="18" />
        </svg>
      );
    case 'square':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <rect x="4" y="4" width="32" height="32" rx="2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AnswerButton({
  text,
  color,
  shape,
  isSelected,
  isDisabled,
  onClick,
  index,
}: AnswerButtonProps) {
  const { play } = useSound();
  return (
    <button
      onClick={() => { play('click'); onClick(); }}
      disabled={isDisabled}
      className={cn(
        'relative w-full h-full min-h-[100px] rounded-xl p-4',
        'flex items-center gap-3 md:gap-4',
        'text-white font-display font-bold text-lg md:text-xl',
        'transition-all duration-200 active:scale-[0.97]',
        'focus:outline-none focus:ring-4 focus:ring-white/50',
        isSelected && 'ring-4 ring-white shadow-lg scale-[0.98]',
        isDisabled && !isSelected && 'opacity-50 cursor-not-allowed',
        isDisabled && isSelected && 'cursor-default',
        !isDisabled && 'hover:brightness-110 cursor-pointer'
      )}
      style={{
        backgroundColor: color,
        animationDelay: `${index * 75}ms`,
      }}
      aria-label={`Answer ${index + 1}: ${text}`}
    >
      <ShapeIcon shape={shape} className="text-white/80" />
      <span className="flex-1 text-left leading-snug line-clamp-3">
        {text}
      </span>
      {isSelected && (
        <div className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center animate-bounce-in">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke={color}
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
