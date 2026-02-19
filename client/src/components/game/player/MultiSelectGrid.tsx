import { useState } from 'react';
import { cn, isLightColor } from '@/lib/utils';
import { useSound } from '@/context/SoundContext';
import { ANSWER_COLORS, ANSWER_SHAPES } from '@/lib/constants';
import type { AnswerShape } from '@shared/types/quiz';

interface AnswerOption {
  id: string;
  text: string;
  orderIndex: number;
}

interface MultiSelectGridProps {
  answers: AnswerOption[];
  requireAll: boolean;
  onSubmit: (answerIds: string[]) => void;
  submitted: boolean;
  disabled: boolean;
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

export default function MultiSelectGrid({
  answers,
  requireAll,
  onSubmit,
  submitted,
  disabled,
}: MultiSelectGridProps) {
  const { play } = useSound();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sorted = [...answers].sort((a, b) => a.orderIndex - b.orderIndex);

  const toggleAnswer = (id: string) => {
    if (submitted || disabled) return;
    play('click');
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0 || submitted || disabled) return;
    play('submit');
    onSubmit(Array.from(selected));
  };

  return (
    <div className="flex flex-col w-full h-full p-3 md:p-4">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
        {sorted.map((answer, index) => {
          const color = ANSWER_COLORS[index % ANSWER_COLORS.length];
          const shape = ANSWER_SHAPES[index % ANSWER_SHAPES.length] as AnswerShape;
          const isChecked = selected.has(answer.id);

          const light = isLightColor(color);
          return (
            <button
              key={answer.id}
              onClick={() => toggleAnswer(answer.id)}
              disabled={submitted || disabled}
              className={cn(
                'relative w-full min-h-[80px] rounded-xl p-4',
                'flex items-center gap-3 md:gap-4',
                'font-display font-bold text-lg md:text-xl',
                light ? 'text-gray-900' : 'text-white',
                'transition-all duration-200 active:scale-[0.97]',
                'focus:outline-none focus:ring-4 focus:ring-white/50',
                isChecked && 'ring-4 ring-white shadow-lg',
                submitted && 'opacity-70 cursor-default',
                !submitted && !disabled && 'hover:brightness-110 cursor-pointer'
              )}
              style={{ backgroundColor: color }}
            >
              <ShapeIcon shape={shape} className={light ? 'text-gray-900/70' : 'text-white/80'} />
              <span className="flex-1 text-left leading-snug line-clamp-3">
                {answer.text}
              </span>
              {/* Checkbox indicator */}
              <div
                className={cn(
                  'w-7 h-7 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors',
                  isChecked
                    ? light ? 'bg-gray-900 border-gray-900' : 'bg-white border-white'
                    : light ? 'bg-gray-900/10 border-gray-900/50' : 'bg-white/10 border-white/50'
                )}
              >
                {isChecked && (
                  <svg
                    className={cn('w-5 h-5', light ? 'stroke-white' : 'stroke-current')}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke={light ? undefined : color}
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      {!submitted && !disabled && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={selected.size === 0}
            className={cn(
              'px-8 py-3 rounded-xl font-display font-bold text-lg transition-all',
              selected.size > 0
                ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg'
                : 'bg-white/20 text-white/50 cursor-not-allowed'
            )}
          >
            Confirm ({selected.size} selected)
            {requireAll && (
              <span className="block text-xs font-normal opacity-70">
                Select all correct answers
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
