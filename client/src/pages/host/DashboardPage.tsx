import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizzes } from '@/hooks/useQuizzes';
import { createGameApi } from '@/api/game.api';
import QuizCardGrid from '@/components/quiz/QuizCardGrid';
import CreateQuizFab from '@/components/quiz/CreateQuizFab';
import DeleteQuizDialog from '@/components/quiz/DeleteQuizDialog';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { QuizSummary } from '@shared/types/quiz';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { quizzes, isLoading, error, deleteQuiz, createQuiz } = useQuizzes();

  const [deleteTarget, setDeleteTarget] = useState<QuizSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleDeleteClick = useCallback(
    (id: string) => {
      const quiz = quizzes.find((q) => q.id === id);
      if (quiz) {
        setDeleteTarget(quiz);
      }
    },
    [quizzes]
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      setActionError(null);
      await deleteQuiz(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || 'Failed to delete quiz';
      setActionError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, deleteQuiz]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handlePlay = useCallback(
    async (id: string) => {
      try {
        setActionError(null);
        const { sessionId } = await createGameApi(id);
        navigate(`/host/${sessionId}`);
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.message || 'Failed to start game';
        setActionError(message);
      }
    },
    [navigate]
  );

  const handleCreateQuiz = useCallback(async () => {
    try {
      setIsCreating(true);
      setActionError(null);
      const quiz = await createQuiz('Untitled Quiz');
      navigate(`/quiz/${quiz.id}/edit`);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || 'Failed to create quiz';
      setActionError(message);
    } finally {
      setIsCreating(false);
    }
  }, [createQuiz, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-lg bg-red-50 p-6 max-w-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto h-10 w-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mt-3 text-sm font-semibold text-red-800">
            Failed to load quizzes
          </h3>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">
          My Quizzes
        </h1>
        <p className="mt-1 text-gray-500">
          Create, manage, and host your quizzes.
        </p>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-red-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">{actionError}</p>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="shrink-0 text-red-400 hover:text-red-600"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Quiz grid */}
      <QuizCardGrid
        quizzes={quizzes}
        onDelete={handleDeleteClick}
        onPlay={handlePlay}
      />

      {/* Create quiz FAB */}
      <CreateQuizFab onClick={handleCreateQuiz} />

      {/* Delete confirmation dialog */}
      <DeleteQuizDialog
        isOpen={deleteTarget !== null}
        quizTitle={deleteTarget?.title ?? ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
