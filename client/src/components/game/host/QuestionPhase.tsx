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

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: question number + timer */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 pt-4 pb-2">
        <div className="text-white/70 font-display font-semibold text-lg">
          Question {questionIndex + 1} of {totalQuestions}
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

      {/* Answer options: 2x2 grid */}
      <div className="flex-1 px-4 pb-4">
        <div className="max-w-5xl mx-auto h-full grid grid-cols-2 grid-rows-2 gap-3">
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
      </div>
    </div>
  );
}
