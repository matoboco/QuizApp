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
  const isNumberGuess = question.questionType === 'number-guess';

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-6">
      {/* Question text recap */}
      <h2 className="font-display font-bold text-2xl md:text-3xl text-white text-shadow text-center mb-8 max-w-3xl animate-fade-in">
        {question.text}
      </h2>

      {isNumberGuess ? (
        <div className="animate-fade-in text-center" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-8 max-w-md mx-auto">
            <p className="text-white/70 text-sm uppercase tracking-wide mb-2">Correct Answer</p>
            <p className="text-5xl font-bold text-white mb-4">{question.correctNumber}</p>
            <p className="text-white/60 text-lg">
              ± {question.tolerance} tolerance
            </p>
          </div>
        </div>
      ) : (
        /* Distribution chart */
        <div className="w-full animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <AnswerDistributionChart distribution={answerDistribution} />
        </div>
      )}
    </div>
  );
}
