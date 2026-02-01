import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuizSummary } from '@shared/types/quiz';
import { formatDate, cn } from '@/lib/utils';
import Button from '@/components/common/Button';

interface QuizCardProps {
  quiz: QuizSummary;
  onDelete: (id: string) => void;
  onPlay: (id: string) => void;
  onExport: (id: string) => void;
}

export default function QuizCard({ quiz, onDelete, onPlay, onExport }: QuizCardProps) {
  const navigate = useNavigate();

  const truncatedDescription =
    quiz.description && quiz.description.length > 100
      ? quiz.description.slice(0, 100) + '...'
      : quiz.description;

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary-200">
      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Header row: title + published badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-display font-bold text-gray-900 leading-tight line-clamp-2">
            {quiz.title}
          </h3>
          {quiz.isPublished ? (
            <span className="inline-flex shrink-0 items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
              Published
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
              Draft
            </span>
          )}
        </div>

        {/* Description */}
        <p className="mt-2 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">
          {truncatedDescription || 'No description'}
        </p>

        {/* Meta info */}
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {quiz.questionCount} {quiz.questionCount === 1 ? 'question' : 'questions'}
          </span>
          <span className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            {formatDate(quiz.createdAt)}
          </span>
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/quiz/${quiz.id}/edit`)}
          className="flex items-center gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          Edit
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => onExport(quiz.id)}
          className="flex items-center gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => onPlay(quiz.id)}
          className="flex items-center gap-1.5"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Play
        </Button>

        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(quiz.id)}
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
