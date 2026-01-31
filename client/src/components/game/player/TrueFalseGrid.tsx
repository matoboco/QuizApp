import { cn } from '@/lib/utils';

interface AnswerOption {
  id: string;
  text: string;
  orderIndex: number;
}

interface TrueFalseGridProps {
  answers: AnswerOption[];
  onSelect: (answerId: string) => void;
  selectedId?: string;
  disabled: boolean;
}

export default function TrueFalseGrid({
  answers,
  onSelect,
  selectedId,
  disabled,
}: TrueFalseGridProps) {
  const sorted = [...answers].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4 justify-center">
      {sorted.map((answer) => {
        const isTrue = answer.text.toLowerCase() === 'true' || answer.orderIndex === 0;
        const isSelected = selectedId === answer.id;
        const bgColor = isTrue ? '#22c55e' : '#ef4444';

        return (
          <button
            key={answer.id}
            onClick={() => onSelect(answer.id)}
            disabled={disabled || selectedId !== undefined}
            className={cn(
              'w-full min-h-[120px] rounded-xl p-6',
              'flex items-center justify-center',
              'text-white font-display font-bold text-2xl md:text-3xl',
              'transition-all duration-200 active:scale-[0.97]',
              'focus:outline-none focus:ring-4 focus:ring-white/50',
              isSelected && 'ring-4 ring-white shadow-lg scale-[0.98]',
              disabled && !isSelected && 'opacity-50 cursor-not-allowed',
              disabled && isSelected && 'cursor-default',
              !disabled && 'hover:brightness-110 cursor-pointer'
            )}
            style={{ backgroundColor: bgColor }}
          >
            <span>{answer.text}</span>
            {isSelected && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center animate-bounce-in">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke={bgColor}
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
