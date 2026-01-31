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
];

export default function QuestionTypeSelector({ value, onChange }: QuestionTypeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Question Type
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUESTION_TYPE_OPTIONS.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            className={cn(
              'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all text-center',
              value === option.type
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
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
