import { useState, useEffect } from 'react';
import type { AnswerDistribution } from '@shared/types/game';
import { ANSWER_COLORS } from '@/lib/constants';

interface AnswerDistributionChartProps {
  distribution: AnswerDistribution[];
}

export default function AnswerDistributionChart({
  distribution,
}: AnswerDistributionChartProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger the grow animation after mount
    const timer = setTimeout(() => setAnimate(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const sorted = [...distribution].sort((a, b) => a.orderIndex - b.orderIndex);
  const maxCount = Math.max(1, ...sorted.map((d) => d.count));

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Vertical bar chart */}
      <div className="flex items-end justify-center gap-4 md:gap-8" style={{ minHeight: 280 }}>
        {sorted.map((item, idx) => {
          const color = ANSWER_COLORS[idx % ANSWER_COLORS.length];
          const heightPercent = (item.count / maxCount) * 100;

          return (
            <div key={item.answerId} className="flex flex-col items-center flex-1 max-w-[160px]">
              {/* Count label */}
              <div
                className="font-display font-bold text-2xl text-white mb-2 transition-all duration-700"
                style={{ opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(10px)' }}
              >
                {item.count}
              </div>

              {/* Bar */}
              <div className="w-full relative" style={{ height: 200 }}>
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700 ease-out flex items-start justify-center pt-2"
                  style={{
                    backgroundColor: color,
                    height: animate ? `${Math.max(heightPercent, 8)}%` : '0%',
                  }}
                >
                  {/* Checkmark for correct answer */}
                  {item.isCorrect && (
                    <div
                      className="bg-white rounded-full p-1 shadow-md transition-all duration-700"
                      style={{ opacity: animate ? 1 : 0, transitionDelay: '0.5s' }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5 text-green-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Answer text label */}
              <div
                className="mt-3 text-center px-1 w-full"
              >
                <p
                  className="font-semibold text-sm md:text-base leading-tight truncate"
                  style={{ color }}
                >
                  {item.answerText}
                </p>
                {item.isCorrect && (
                  <span className="inline-block mt-1 text-xs font-bold text-green-400 uppercase tracking-wide">
                    Correct
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
