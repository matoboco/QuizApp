import type { Question, Answer } from '@shared/types/quiz';
import { MAX_ANSWERS } from '@shared/types/quiz';
import AnswerEditor from './AnswerEditor';
import TimeLimitSlider from './TimeLimitSlider';
import Button from '@/components/common/Button';

interface QuestionEditorProps {
  question: Question;
  onChange: (data: Partial<Question>) => void;
  onAnswerChange: (answerIndex: number, data: Partial<Answer>) => void;
  onAddAnswer: () => void;
  onRemoveAnswer: (answerIndex: number) => void;
}

export default function QuestionEditor({
  question,
  onChange,
  onAnswerChange,
  onAddAnswer,
  onRemoveAnswer,
}: QuestionEditorProps) {
  return (
    <div className="space-y-6">
      {/* Question text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Question
        </label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Type your question here..."
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

      {/* Answers */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Answers
          </label>
          {question.answers.length < MAX_ANSWERS && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onAddAnswer}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Answer
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {question.answers.map((answer, answerIndex) => (
            <AnswerEditor
              key={answer.id}
              answer={answer}
              index={answerIndex}
              onChange={(data) => onAnswerChange(answerIndex, data)}
              onRemove={() => onRemoveAnswer(answerIndex)}
              canRemove={question.answers.length > 2}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
