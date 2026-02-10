import type { Question, Answer, QuestionType } from '@shared/types/quiz';
import { DEFAULT_TOLERANCE } from '@shared/types/quiz';
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
  const isNumberGuess = question.questionType === 'number-guess';

  return (
    <div className="space-y-6">
      {/* Question type */}
      <QuestionTypeSelector
        value={question.questionType}
        onChange={onChangeType}
      />

      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Question
        </label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder={isOrdering ? 'e.g. "Put these events in chronological order"' : 'Type your question here...'}
          rows={3}
          className="w-full text-lg border rounded-lg border-primary-500/20 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-cyber-surface text-gray-100 px-4 py-3 outline-none resize-none placeholder-gray-500"
        />
      </div>

      {/* Description/hint (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Description / Hint (optional)
        </label>
        <input
          type="text"
          value={question.description || ''}
          onChange={(e) => onChange({ description: e.target.value || undefined })}
          placeholder="e.g. Select all correct answers, Double points!"
          className="input"
        />
        <p className="mt-1 text-xs text-gray-400">
          Shown to players below the question text
        </p>
      </div>

      {/* Image URL (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
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
          <div className="mt-2 relative rounded-lg overflow-hidden bg-cyber-surface max-h-48 flex items-center justify-center">
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
          <label className="block text-sm font-medium text-gray-300 mb-1">
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

      {/* Number Guess: correctNumber + tolerance */}
      {isNumberGuess && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Correct Number
            </label>
            <input
              type="number"
              value={question.correctNumber ?? ''}
              onChange={(e) => onChange({ correctNumber: e.target.value === '' ? undefined : Number(e.target.value) })}
              placeholder="e.g. 863"
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tolerance (±)
            </label>
            <input
              type="number"
              min={1}
              value={question.tolerance ?? DEFAULT_TOLERANCE}
              onChange={(e) => onChange({ tolerance: e.target.value === '' ? undefined : Number(e.target.value) })}
              placeholder={`e.g. ${DEFAULT_TOLERANCE}`}
              className="input"
            />
            <p className="mt-1 text-xs text-gray-400">
              Answers within ±{question.tolerance ?? DEFAULT_TOLERANCE} of the correct number get partial points
            </p>
          </div>
        </div>
      )}

      {/* Multi-select: requireAll toggle */}
      {isMultiSelect && (
        <div className="flex items-center gap-3 p-3 bg-primary-500/10 rounded-lg border border-primary-500/20">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={question.requireAll}
              onChange={(e) => onChange({ requireAll: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-600 rounded focus:ring-primary-500 bg-cyber-surface"
            />
            <span className="text-sm font-medium text-primary-300">
              Require all correct answers
            </span>
          </label>
          <span className="text-xs text-primary-400">
            {question.requireAll
              ? 'All-or-nothing: player must select every correct answer'
              : 'Partial credit: points based on how many correct answers selected'}
          </span>
        </div>
      )}

      {/* Validation errors */}
      {errors && errors.length > 0 && (
        <div className="flex gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <ul className="text-sm text-red-400 space-y-0.5">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Answers (hidden for number-guess) */}
      {!isNumberGuess && <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-300">
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
      </div>}
    </div>
  );
}
