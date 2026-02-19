import type { Answer, QuestionType } from '@shared/types/quiz';
import { ANSWER_COLORS, ANSWER_SHAPES } from '@shared/types/quiz';
import { cn, isLightColor } from '@/lib/utils';

interface AnswerEditorProps {
  answer: Answer;
  index: number;
  questionType: QuestionType;
  onChange: (data: Partial<Answer>) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function ShapeIcon({ shape, className }: { shape: string; className?: string }) {
  const classes = cn('w-6 h-6', className);

  switch (shape) {
    case 'triangle':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      );
    case 'circle':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'square':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="2" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" />
        </svg>
      );
    case 'star':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      );
    case 'pentagon':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 9l4 11h12l4-11L12 2z" />
        </svg>
      );
    case 'heart':
      return (
        <svg className={classes} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AnswerEditor({
  answer,
  index,
  questionType,
  onChange,
  onRemove,
  canRemove,
}: AnswerEditorProps) {
  const color = ANSWER_COLORS[index % ANSWER_COLORS.length] || ANSWER_COLORS[0];
  const shape = ANSWER_SHAPES[index % ANSWER_SHAPES.length] || ANSWER_SHAPES[0];

  const isOrdering = questionType === 'ordering';
  const isTrueFalse = questionType === 'true-false';

  const light = isLightColor(color);

  return (
    <div
      className="relative rounded-lg p-4 min-h-[120px] flex flex-col"
      style={{ backgroundColor: color }}
    >
      {/* Delete button */}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={cn(
            'absolute top-2 right-2 p-1 rounded-full transition-colors',
            light
              ? 'bg-black/10 text-gray-900/70 hover:bg-black/20 hover:text-gray-900'
              : 'bg-black/20 text-white/80 hover:bg-black/40 hover:text-white'
          )}
          title="Remove answer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Order number for ordering type */}
      {isOrdering && (
        <div className={cn('absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', light ? 'bg-gray-900/15 text-gray-900' : 'bg-white/30 text-white')}>
          {index + 1}
        </div>
      )}

      {/* Shape icon and text input */}
      <div className="flex items-start gap-3 flex-1">
        {!isOrdering && (
          <ShapeIcon shape={shape} className={cn('flex-shrink-0 mt-1', light ? 'text-gray-900/50' : 'text-white/60')} />
        )}
        <input
          type="text"
          value={answer.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={isOrdering ? `Item ${index + 1}` : `Answer ${index + 1}`}
          className={cn(
            'flex-1 bg-transparent border-0 border-b font-medium focus:ring-0 outline-none text-sm pb-1',
            light
              ? 'border-gray-900/30 text-gray-900 placeholder-gray-900/50 focus:border-gray-900'
              : 'border-white/30 text-white placeholder-white/50 focus:border-white'
          )}
          disabled={isTrueFalse}
        />
      </div>

      {/* Correct toggle - not shown for ordering (order IS the answer) */}
      {!isOrdering && (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange({ isCorrect: !answer.isCorrect })}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold transition-colors',
              answer.isCorrect
                ? 'bg-white text-green-700'
                : light
                  ? 'bg-black/10 text-gray-900/70 hover:bg-black/20'
                  : 'bg-black/20 text-white/80 hover:bg-black/30'
            )}
          >
            {answer.isCorrect ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="9" />
              </svg>
            )}
            {answer.isCorrect ? 'Correct' : 'Mark correct'}
          </button>
        </div>
      )}
    </div>
  );
}
