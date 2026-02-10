import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuizzes } from '@/hooks/useQuizzes';
import { createGameApi } from '@/api/game.api';
import { getQuizApi, getPublicQuizApi, createQuizApi, updateQuizApi, duplicateQuizApi } from '@/api/quiz.api';
import QuizCardGrid from '@/components/quiz/QuizCardGrid';
import DeleteQuizDialog from '@/components/quiz/DeleteQuizDialog';
import ImportQuizButton from '@/components/quiz/ImportQuizButton';
import Button from '@/components/common/Button';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { serializeQuizTxt, downloadQuizTxt, sanitizeFilename, type ParsedQuiz } from '@/lib/quizTxt';
import type { QuizSummary } from '@shared/types/quiz';

type DashboardTab = 'my' | 'public';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { quizzes, publicQuizzes, isLoading, error, refetch, deleteQuiz, createQuiz } = useQuizzes();

  const [activeTab, setActiveTab] = useState<DashboardTab>('my');
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

  const handleExport = useCallback(async (id: string) => {
    try {
      setActionError(null);
      // Try own quiz first, fall back to public
      let quiz;
      try {
        quiz = await getQuizApi(id);
      } catch {
        quiz = await getPublicQuizApi(id);
      }
      const content = serializeQuizTxt(quiz);
      const filename = `${sanitizeFilename(quiz.title)}.quiz.txt`;
      downloadQuizTxt(filename, content);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || 'Failed to export quiz';
      setActionError(message);
    }
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    try {
      setActionError(null);
      await duplicateQuizApi(id);
      await refetch();
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || 'Failed to duplicate quiz';
      setActionError(message);
    }
  }, [refetch]);

  const handleImport = useCallback(async (parsed: ParsedQuiz) => {
    try {
      setActionError(null);
      const quiz = await createQuizApi({ title: parsed.title, description: parsed.description });
      await updateQuizApi(quiz.id, { questions: parsed.questions });
      await refetch();
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || 'Failed to import quiz';
      setActionError(message);
    }
  }, [refetch]);

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
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-6 max-w-md">
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
          <h3 className="mt-3 text-sm font-semibold text-red-400">
            Failed to load quizzes
          </h3>
          <p className="mt-1 text-sm text-red-400/80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-100">
            Quizzes
          </h1>
          <p className="mt-1 text-gray-400">
            Create, manage, and host your quizzes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportQuizButton onImport={handleImport} />
          <Button
            variant="primary"
            onClick={handleCreateQuiz}
            isLoading={isCreating}
            className="flex items-center gap-1.5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Quiz
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-primary-500/10">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('my')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'my'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            My Quizzes
            {quizzes.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-400">
                {quizzes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'public'
                ? 'border-primary-400 text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
            }`}
          >
            Public Quizzes
            {publicQuizzes.length > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary-500/10 px-2 py-0.5 text-xs font-medium text-primary-400">
                {publicQuizzes.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Action error banner */}
      {actionError && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-4 flex items-start gap-3">
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
            <p className="text-sm text-red-400">{actionError}</p>
          </div>
          <button
            onClick={() => setActionError(null)}
            className="shrink-0 text-red-400 hover:text-red-300"
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

      {/* Quiz grids */}
      {activeTab === 'my' ? (
        <QuizCardGrid
          quizzes={quizzes}
          mode="own"
          onDelete={handleDeleteClick}
          onPlay={handlePlay}
          onExport={handleExport}
          onDuplicate={handleDuplicate}
          emptyMessage="No quizzes yet"
        />
      ) : (
        <QuizCardGrid
          quizzes={publicQuizzes}
          mode="public"
          onExport={handleExport}
          onDuplicate={handleDuplicate}
          emptyMessage="No public quizzes available"
        />
      )}

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
