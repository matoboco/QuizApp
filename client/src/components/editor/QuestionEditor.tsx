import type { Question, Answer, QuestionType } from '@shared/types/quiz';
import AnswerEditor from './AnswerEditor';
import TimeLimitSlider from './TimeLimitSlider';
import QuestionTypeSelector from './QuestionTypeSelector';
import Button from '@/components/common/Button';

interface QuestionEditorProps {
  question: Question;
  errors?: string[];
  onChange: (data: Partial<Question>) => void;
  onChangeType: (type: QuestionType) => void;
  onAnswerChange: (answerIndex: number, data: Partial<Answer>) => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (answerIndex: number) => void;
}

export default function QuestionEditor({
  question,
  errors,
  onChange,
  onChangeType,
  onAnswerChange,
  onAddAnswer,
  onRemoveAnswer,
}: QuestionEditorProps) {
  const maxAnswers = question.questionType === 'true-false' ? 2
    : (question.questionType === 'multi-select' || question.questionType === 'ordering') ? 8
    : 4;

  const canAddAnswer = question.answers.length < maxAnswers && question.questionType !== 'true-false';
  const canRemoveAnswer = question.answers.length > 2 && question.questionType !== 'true-false';

  const isOrdering = question.questionType === 'ordering';
  const isMultiSelect = question.questionType === 'multi-select';

  return (
    <div className="space-y-6">
      {/* Question type */}
      <QuestionTypeSelector
        value={question.questionType}
        onChange={onChangeType}
      />

      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question
        </label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={isOrdering ? 'e.g. "Put these events in chronological order"' : 'Type your question here...'}
          rows={3}
          className="w-full text-lg border rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white px-4 py-3 outline-none resize-none placeholder-gray-400"
        />
      </div>

      {/* Image URL (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image URL (optional)
        </label>
        <input
          type="url"
          value={question.imageUrl || ''}
          onChange={(e) => onChange({ imageUrl: e.target.value || undefined })}
          placeholder="https://example.com/image.jpg"
          className="input"
        />
        {question.imageUrl && (
          <div className="mt-2 relative rounded-lg overflow-hidden bg-gray-100 max-h-48 flex items-center justify-center">
            <img
              src={question.imageUrl}
              alt="Question image"
              className="max-h-48 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Time Limit and Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TimeLimitSlider
          value={question.timeLimit}
          onChange={(timeLimit) => onChange({ timeLimit })}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Points
          </label>
          <input
            type="number"
            min={0}
            max={2000}
            step={100}
            value={question.points}
            onChange={(e) => onChange({ points: Number(e.target.value) })}
            className="input"
          />
        </div>
      </div>

      {/* Multi-select: requireAll toggle */}
      {isMultiSelect && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={question.requireAll}
              onChange={(e) => onChange({ requireAll: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm font-medium text-blue-800">
              Require all correct answers
            </span>
          </label>
          <span className="text-xs text-blue-600">
            {question.requireAll
              ? 'All-or-nothing: player must select every correct answer'
              : 'Partial credit: points based on how many correct answers selected'}
          </span>
        </div>
      )}

      {/* Validation errors */}
      {errors && errors.length > 0 && (
        <div className="flex gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <ul className="text-sm text-red-700 space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Answers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            {isOrdering ? 'Items (correct order, top to bottom)' : 'Answers'}
          </label>
          {canAddAnswer && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddAnswer}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add {isOrdering ? 'Item' : 'Answer'}
            </Button>
          )}
        </div>

        {isOrdering && (
          <p className="text-xs text-gray-500 mb-2">
            The order below defines the correct answer. Players will see items shuffled.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.answers.map((answer, answerIndex) => (
            <AnswerEditor
              key={answer.id}
              answer={answer}
              index={answerIndex}
              questionType={question.questionType}
              onChange={(data) => onAnswerChange(answerIndex, data)}
              onRemove={() => onRemoveAnswer(answerIndex)}
              canRemove={canRemoveAnswer}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
