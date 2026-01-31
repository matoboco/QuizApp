import type { Question } from '@shared/types/quiz';
import type { AnswerDistribution } from '@shared/types/game';
import AnswerDistributionChart from './AnswerDistributionChart';

interface ResultPhaseProps {
  question: Question;
  answerDistribution: AnswerDistribution[];
}

export default function ResultPhase({
  question,
  answerDistribution,
}: ResultPhaseProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6">
      {/* Question text recap */}
      <h2 className="font-display font-bold text-2xl md:text-3xl text-white text-shadow text-center mb-8 max-w-3xl animate-fade-in">
        {question.text}
      </h2>

      {/* Distribution chart */}
      <div className="w-full animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
        <AnswerDistributionChart distribution={answerDistribution} />
      </div>
    </div>
  );
}
