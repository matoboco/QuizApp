import { cn, isLightColor } from '@/lib/utils';
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
    case 'hexagon':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <polygon points="20,2 37,11 37,29 20,38 3,29 3,11" />
        </svg>
      );
    case 'star':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <polygon points="20,2 25,15 39,15 28,23 32,37 20,29 8,37 12,23 1,15 15,15" />
        </svg>
      );
    case 'pentagon':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <polygon points="20,2 38,15 31,36 9,36 2,15" />
        </svg>
      );
    case 'heart':
      return (
        <svg className={iconClass} viewBox="0 0 40 40" fill="currentColor">
          <path d="M20,36 C14,30 2,22 2,13 A9,9,0,0,1,20,10 A9,9,0,0,1,38,13 C38,22 26,30 20,36Z" />
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
  const light = isLightColor(color);
  return (
    <button
      onClick={() => { play('click'); onClick(); }}
      disabled={isDisabled}
      className={cn(
        'relative w-full h-full min-h-[100px] rounded-xl p-4',
        'flex items-center gap-3 md:gap-4',
        'font-display font-bold text-lg md:text-xl',
        light ? 'text-gray-900' : 'text-white',
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
      <ShapeIcon shape={shape} className={light ? 'text-gray-900/70' : 'text-white/80'} />
      <span className="flex-1 text-left leading-snug line-clamp-3">
        {text}
      </span>
      {isSelected && (
        <div className={cn('absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center animate-bounce-in', light ? 'bg-gray-900' : 'bg-white')}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke={light ? '#ffffff' : color}
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
