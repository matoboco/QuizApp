import type { QuestionStats } from '@shared/types';
import { ANSWER_COLORS } from '@/lib/constants';

interface QuestionStatsPanelProps {
  stats: QuestionStats;
}

export default function QuestionStatsPanel({ stats }: QuestionStatsPanelProps) {
  const accuracy = stats.totalAnswers > 0
    ? Math.round((stats.correctCount / stats.totalAnswers) * 100)
    : 0;

  const maxCount = Math.max(...stats.answerDistribution.map((a) => a.count), 1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-medium text-gray-900 mb-2">
        Q{stats.questionIndex + 1}: {stats.questionText}
      </h3>

      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-4 mb-6 mt-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">{accuracy}%</p>
          <p className="text-sm text-gray-500">Accuracy</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {stats.correctCount}/{stats.totalAnswers}
          </p>
          <p className="text-sm text-gray-500">Correct</p>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <p className="text-2xl font-bold text-gray-900">
            {(stats.averageTime / 1000).toFixed(1)}s
          </p>
          <p className="text-sm text-gray-500">Avg. Time</p>
        </div>
      </div>

      {/* Answer distribution */}
      <h4 className="font-medium text-gray-700 mb-3">Answer Distribution</h4>
      <div className="space-y-3">
        {stats.answerDistribution.map((answer, index) => {
          const percentage = stats.totalAnswers > 0
            ? Math.round((answer.count / stats.totalAnswers) * 100)
            : 0;
          const barWidth = (answer.count / maxCount) * 100;

          return (
            <div key={answer.answerId}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-sm ${answer.isCorrect ? 'font-medium text-green-700' : 'text-gray-700'}`}>
                  {answer.text}
                  {answer.isCorrect && (
                    <span className="ml-2 text-green-600">✓</span>
                  )}
                </span>
                <span className="text-sm text-gray-500">
                  {answer.count} ({percentage}%)
                </span>
              </div>
              <div className="h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all ${
                    answer.isCorrect ? 'bg-green-500' : ''
                  }`}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: answer.isCorrect ? undefined : ANSWER_COLORS[index % ANSWER_COLORS.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
