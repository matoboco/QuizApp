import React from 'react';
import type { QuizSummary } from '@shared/types/quiz';
import QuizCard from './QuizCard';

interface QuizCardGridProps {
  quizzes: QuizSummary[];
  onDelete: (id: string) => void;
  onPlay: (id: string) => void;
}

export default function QuizCardGrid({ quizzes, onDelete, onPlay }: QuizCardGridProps) {
  if (quizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-4 text-lg font-display font-semibold text-gray-700">
          No quizzes yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Create your first quiz by clicking the + button below.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {quizzes.map((quiz) => (
        <QuizCard
          key={quiz.id}
          quiz={quiz}
          onDelete={onDelete}
          onPlay={onPlay}
        />
      ))}
    </div>
  );
}
