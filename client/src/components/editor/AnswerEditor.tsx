import type { Answer } from '@shared/types/quiz';
import { ANSWER_COLORS, ANSWER_SHAPES } from '@shared/types/quiz';
import { cn } from '@/lib/utils';

interface AnswerEditorProps {
  answer: Answer;
  index: number;
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
    default:
      return null;
  }
}

export default function AnswerEditor({
  answer,
  index,
  onChange,
  onRemove,
  canRemove,
}: AnswerEditorProps) {
  const color = ANSWER_COLORS[index] || ANSWER_COLORS[0];
  const shape = ANSWER_SHAPES[index] || ANSWER_SHAPES[0];

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
          className="absolute top-2 right-2 p-1 rounded-full bg-black/20 text-white/80 hover:bg-black/40 hover:text-white transition-colors"
          title="Remove answer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Shape icon and text input */}
      <div className="flex items-start gap-3 flex-1">
        <ShapeIcon shape={shape} className="text-white/60 flex-shrink-0 mt-1" />
        <input
          type="text"
          value={answer.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={`Answer ${index + 1}`}
          className="flex-1 bg-transparent border-0 border-b border-white/30 text-white font-medium placeholder-white/50 focus:border-white focus:ring-0 outline-none text-sm pb-1"
        />
      </div>

      {/* Correct toggle */}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ isCorrect: !answer.isCorrect })}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold transition-colors',
            answer.isCorrect
              ? 'bg-white text-green-700'
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
    </div>
  );
}
