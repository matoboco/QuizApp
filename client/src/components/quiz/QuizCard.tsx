import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { QuizSummary } from '@shared/types/quiz';
import { formatDate, cn } from '@/lib/utils';
import Button from '@/components/common/Button';

interface QuizCardProps {
  quiz: QuizSummary;
  mode?: 'own' | 'public';
  onDelete?: (id: string) => void;
  onPlay?: (id: string) => void;
  onExport?: (id: string) => void;
  onDuplicate?: (id: string) => void;
}

function QuizCardMenu({
  onExport,
  onDuplicate,
  onDelete,
}: {
  onExport?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative ml-auto">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 bottom-full z-20 mb-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1">
            {onExport && (
              <button
                onClick={() => { setIsOpen(false); onExport(); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={() => { setIsOpen(false); onDuplicate(); }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Duplicate
              </button>
            )}
            {onDelete && (
              <>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={() => { setIsOpen(false); onDelete(); }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function QuizCard({ quiz, mode = 'own', onDelete, onPlay, onExport, onDuplicate }: QuizCardProps) {
  const navigate = useNavigate();
  const isOwn = mode === 'own';
  const isLocked = isOwn && quiz.gameCount > 0;

  const truncatedDescription =
    quiz.description && quiz.description.length > 100
      ? quiz.description.slice(0, 100) + '...'
      : quiz.description;

  return (
    <div className="group relative flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary-200">
      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        {/* Header row: title + badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-display font-bold text-gray-900 leading-tight line-clamp-2">
            {quiz.title}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {isLocked && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700" title="Quiz has been played — duplicate to edit">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Locked
              </span>
            )}
            {quiz.isPublished ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Public
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                Private
              </span>
            )}
          </div>
        </div>

        {/* Author for public quizzes */}
        {!isOwn && quiz.hostUsername && (
          <p className="mt-1 text-xs text-primary-600 font-medium">
            by {quiz.hostUsername}
          </p>
        )}

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
          {isOwn && quiz.gameCount > 0 && (
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
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {quiz.gameCount} {quiz.gameCount === 1 ? 'game' : 'games'}
            </span>
          )}
        </div>
      </div>

      {/* Actions footer */}
      <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
        {isOwn ? (
          <>
            {isLocked ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/quiz/${quiz.id}/view`)}
                className="flex items-center gap-1.5"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View
              </Button>
            ) : (
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
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/quiz/${quiz.id}/history`)}
              disabled={quiz.gameCount === 0}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              History
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => onPlay?.(quiz.id)}
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

            <QuizCardMenu
              onExport={() => onExport?.(quiz.id)}
              onDuplicate={() => onDuplicate?.(quiz.id)}
              onDelete={() => onDelete?.(quiz.id)}
            />
          </>
        ) : (
          /* Public mode actions */
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/quiz/${quiz.id}/view`)}
              className="flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate?.(quiz.id)}
              className="flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Duplicate
            </Button>

            <QuizCardMenu
              onExport={() => onExport?.(quiz.id)}
            />
          </>
        )}
      </div>
    </div>
  );
}
