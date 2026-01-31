import type { Question } from '@shared/types/quiz';
import Button from '@/components/common/Button';
import { cn } from '@/lib/utils';

interface QuestionListProps {
  questions: Question[];
  activeIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
}

export default function QuestionList({
  questions,
  activeIndex,
  onSelect,
  onAdd,
  onRemove,
  onMove,
}: QuestionListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Questions ({questions.length})
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={cn(
              'group relative border-b border-gray-100 cursor-pointer transition-colors',
              index === activeIndex
                ? 'bg-primary-50 border-l-4 border-l-primary-500'
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
            )}
            onClick={() => onSelect(index)}
          >
            <div className="px-3 py-3">
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                    index === activeIndex
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  )}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {question.text || 'Untitled question'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {question.answers.length} answers
                  </p>
                </div>
              </div>

              {/* Move and delete controls */}
              <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(index, index - 1);
                  }}
                  disabled={index === 0}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMove(index, index + 1);
                  }}
                  disabled={index === questions.length - 1}
                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="flex-1" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(index);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete question"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200">
        <Button
          variant="primary"
          size="sm"
          onClick={onAdd}
          className="w-full"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </Button>
      </div>
    </div>
  );
}
