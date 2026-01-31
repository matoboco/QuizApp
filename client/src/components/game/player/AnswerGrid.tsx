import AnswerButton from './AnswerButton';
import { ANSWER_COLORS, ANSWER_SHAPES } from '@/lib/constants';

interface AnswerOption {
  id: string;
  text: string;
  orderIndex: number;
}

interface AnswerGridProps {
  answers: AnswerOption[];
  onSelect: (answerId: string) => void;
  selectedId?: string;
  disabled: boolean;
}

export default function AnswerGrid({
  answers,
  onSelect,
  selectedId,
  disabled,
}: AnswerGridProps) {
  // Sort answers by orderIndex to ensure consistent order
  const sorted = [...answers].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full h-full p-3 md:p-4">
      {sorted.map((answer, index) => (
        <AnswerButton
          key={answer.id}
          text={answer.text}
          color={ANSWER_COLORS[index % ANSWER_COLORS.length]}
          shape={ANSWER_SHAPES[index % ANSWER_SHAPES.length]}
          isSelected={selectedId === answer.id}
          isDisabled={disabled || selectedId !== undefined}
          onClick={() => onSelect(answer.id)}
          index={index}
        />
      ))}
    </div>
  );
}
