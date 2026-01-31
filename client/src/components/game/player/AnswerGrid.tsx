import type { QuestionType } from '@shared/types/quiz';
import AnswerButton from './AnswerButton';
import TrueFalseGrid from './TrueFalseGrid';
import MultiSelectGrid from './MultiSelectGrid';
import OrderingGrid from './OrderingGrid';
import { ANSWER_COLORS, ANSWER_SHAPES } from '@/lib/constants';

interface AnswerOption {
  id: string;
  text: string;
  orderIndex: number;
}

interface AnswerGridProps {
  answers: AnswerOption[];
  questionType?: QuestionType;
  requireAll?: boolean;
  onSelect: (answerId: string | string[]) => void;
  selectedId?: string | string[];
  disabled: boolean;
}

export default function AnswerGrid({
  answers,
  questionType = 'multiple-choice',
  requireAll = false,
  onSelect,
  selectedId,
  disabled,
}: AnswerGridProps) {
  switch (questionType) {
    case 'true-false':
      return (
        <TrueFalseGrid
          answers={answers}
          onSelect={(id) => onSelect(id)}
          selectedId={typeof selectedId === 'string' ? selectedId : undefined}
          disabled={disabled}
        />
      );

    case 'multi-select':
      return (
        <MultiSelectGrid
          answers={answers}
          requireAll={requireAll}
          onSubmit={(ids) => onSelect(ids)}
          submitted={selectedId !== undefined && selectedId !== null}
          disabled={disabled}
        />
      );

    case 'ordering':
      return (
        <OrderingGrid
          answers={answers}
          onSubmit={(ids) => onSelect(ids)}
          submitted={selectedId !== undefined && selectedId !== null}
          disabled={disabled}
        />
      );

    case 'multiple-choice':
    default: {
      // Sort answers by orderIndex to ensure consistent order
      const sorted = [...answers].sort((a, b) => a.orderIndex - b.orderIndex);
      const singleSelectedId = typeof selectedId === 'string' ? selectedId : undefined;

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full h-full p-3 md:p-4">
          {sorted.map((answer, index) => (
            <AnswerButton
              key={answer.id}
              text={answer.text}
              color={ANSWER_COLORS[index % ANSWER_COLORS.length]}
              shape={ANSWER_SHAPES[index % ANSWER_SHAPES.length]}
              isSelected={singleSelectedId === answer.id}
              isDisabled={disabled || singleSelectedId !== undefined}
              onClick={() => onSelect(answer.id)}
              index={index}
            />
          ))}
        </div>
      );
    }
  }
}
