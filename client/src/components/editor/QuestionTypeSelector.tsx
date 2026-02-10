import type { QuestionType } from '@shared/types/quiz';
import { cn } from '@/lib/utils';

interface QuestionTypeSelectorProps {
  value: QuestionType;
  onChange: (type: QuestionType) => void;
}

const QUESTION_TYPE_OPTIONS: { type: QuestionType; label: string; icon: string; description: string }[] = [
  {
    type: 'multiple-choice',
    label: 'Multiple Choice',
    icon: 'M9 12l2 2 4-4',
    description: 'One correct answer',
  },
  {
    type: 'true-false',
    label: 'True / False',
    icon: 'M5 13l4 4L19 7',
    description: '2 options',
  },
  {
    type: 'multi-select',
    label: 'Multi Select',
    icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
    description: 'Multiple correct',
  },
  {
    type: 'ordering',
    label: 'Ordering',
    icon: 'M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12',
    description: 'Correct order',
  },
  {
    type: 'number-guess',
    label: 'Number Guess',
    icon: 'M7 20l4-16m2 16l4-16M6 9h14M4 15h14',
    description: 'Guess the number',
  },
];

export default function QuestionTypeSelector({ value, onChange }: QuestionTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Question Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        {QUESTION_TYPE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center',
              value === option.type
                ? 'border-primary-400 bg-primary-500/10 text-primary-300'
                : 'border-primary-500/15 bg-cyber-surface text-gray-400 hover:border-primary-500/30 hover:bg-cyber-elevated'
            )}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d={option.icon} />
            </svg>
            <span className="text-xs font-semibold">{option.label}</span>
            <span className="text-[10px] opacity-70">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
