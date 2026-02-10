import type { Question } from '@shared/types/quiz';
import { ANSWER_COLORS, ANSWER_SHAPES } from '@/lib/constants';
import CountdownTimer from './CountdownTimer';

interface QuestionPhaseProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  timeLimit: number;
  questionStartedAt: number;
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  'multiple-choice': 'Multiple Choice',
  'true-false': 'True / False',
  'multi-select': 'Multi Select',
  'ordering': 'Ordering',
};

function ShapeIcon({ shape, className }: { shape: string; className?: string }) {
  const cls = className || 'w-6 h-6';
  switch (shape) {
    case 'triangle':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 1L1 12l11 11 11-11L12 1z" />
        </svg>
      );
    case 'circle':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'square':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="2" />
        </svg>
      );
    case 'hexagon':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,1 22,6.5 22,17.5 12,23 2,17.5 2,6.5" />
        </svg>
      );
    case 'star':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,1 15,9 23.5,9 17,14.5 19,23 12,18 5,23 7,14.5 0.5,9 9,9" />
        </svg>
      );
    case 'pentagon':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <polygon points="12,1 23,9 19,22 5,22 1,9" />
        </svg>
      );
    case 'heart':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12,21.6 C8.4,18 1.2,13.2 1.2,7.8 A5.4,5.4,0,0,1,12,6 A5.4,5.4,0,0,1,22.8,7.8 C22.8,13.2 15.6,18 12,21.6Z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function QuestionPhase({
  question,
  questionIndex,
  totalQuestions,
  timeLimit,
  questionStartedAt,
}: QuestionPhaseProps) {
  const sortedAnswers = [...question.answers].sort((a, b) => a.orderIndex - b.orderIndex);
  const questionType = question.questionType || 'multiple-choice';
  const isOrdering = questionType === 'ordering';

  // Dynamic grid: 2x2 for 4 answers, 2x1 for 2, flexible for more
  const gridCols = sortedAnswers.length <= 2 ? 'grid-cols-1' : 'grid-cols-2';
  const gridRows = sortedAnswers.length <= 2 ? 'grid-rows-2' : sortedAnswers.length <= 4 ? 'grid-rows-2' : '';

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: question number + type badge + timer */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <div className="text-white/70 font-display font-semibold text-lg">
            Question {questionIndex + 1} of {totalQuestions}
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/15 text-white/80 text-xs font-semibold">
            {QUESTION_TYPE_LABELS[questionType] || questionType}
          </span>
        </div>
        <CountdownTimer
          timeLimit={timeLimit}
          startedAt={questionStartedAt}
        />
      </div>

      {/* Question text */}
      <div className="flex-shrink-0 px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-white font-display font-bold text-3xl md:text-4xl lg:text-5xl text-center text-shadow-lg leading-tight">
            {question.text}
          </h2>
          {question.description && (
            <p className="mt-3 text-white/80 text-lg md:text-xl text-center font-medium">
              {question.description}
            </p>
          )}
          {question.imageUrl && (
            <div className="mt-4 flex justify-center">
              <img
                src={question.imageUrl}
                alt="Question"
                className="max-h-48 rounded-xl shadow-lg object-contain"
              />
            </div>
          )}
        </div>
      </div>

      {/* Answer options */}
      <div className="flex-1 px-4 pb-4">
        {isOrdering ? (
          /* Ordering: vertical list with numbered positions */
          <div className="max-w-3xl mx-auto flex flex-col gap-3">
            {sortedAnswers.map((answer, idx) => {
              const color = ANSWER_COLORS[idx % ANSWER_COLORS.length];
              return (
                <div
                  key={answer.id}
                  className="rounded-xl flex items-center gap-4 px-6 py-4 shadow-lg animate-slide-up"
                  style={{
                    backgroundColor: color,
                    animationDelay: `${idx * 0.1}s`,
                    animationFillMode: 'both',
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {idx + 1}
                  </div>
                  <span className="text-white font-bold text-lg md:text-xl lg:text-2xl leading-snug">
                    {answer.text}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          /* Standard grid for MC, T/F, Multi-select */
          <div className={`max-w-5xl mx-auto h-full grid ${gridCols} ${gridRows} gap-3`}>
            {sortedAnswers.map((answer, idx) => {
              const color = ANSWER_COLORS[idx % ANSWER_COLORS.length];
              const shape = ANSWER_SHAPES[idx % ANSWER_SHAPES.length];

              return (
                <div
                  key={answer.id}
                  className="rounded-xl flex items-center gap-4 px-6 py-4 shadow-lg animate-slide-up"
                  style={{
                    backgroundColor: color,
                    animationDelay: `${idx * 0.1}s`,
                    animationFillMode: 'both',
                  }}
                >
                  <ShapeIcon shape={shape} className="w-8 h-8 text-white/80 flex-shrink-0" />
                  <span className="text-white font-bold text-lg md:text-xl lg:text-2xl leading-snug">
                    {answer.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
