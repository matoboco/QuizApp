import { useState, useEffect, useCallback } from 'react';
import type { QuizSummary, Quiz } from '@shared/types/quiz';
import { getQuizzesApi, getPublicQuizzesApi, createQuizApi, deleteQuizApi } from '@/api/quiz.api';

interface UseQuizzesReturn {
  quizzes: QuizSummary[];
  publicQuizzes: QuizSummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteQuiz: (id: string) => Promise<void>;
  createQuiz: (title: string) => Promise<Quiz>;
}

export function useQuizzes(): UseQuizzesReturn {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [publicQuizzes, setPublicQuizzes] = useState<QuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [myData, pubData] = await Promise.all([
        getQuizzesApi(),
        getPublicQuizzesApi(),
      ]);
      setQuizzes(myData);
      setPublicQuizzes(pubData);
    } catch (err: any) {
      const message =
        err?.response?.data?.error || err?.message || 'Failed to load quizzes';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  const deleteQuiz = useCallback(async (id: string) => {
    await deleteQuizApi(id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const createQuiz = useCallback(async (title: string): Promise<Quiz> => {
    const quiz = await createQuizApi({ title });
    // Refresh the list after creating
    setQuizzes((prev) => [
      {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        isPublished: quiz.isPublished,
        questionCount: quiz.questions.length,
        gameCount: 0,
        createdAt: quiz.createdAt,
        updatedAt: quiz.updatedAt,
      },
      ...prev,
    ]);
    return quiz;
  }, []);

  return {
    quizzes,
    publicQuizzes,
    isLoading,
    error,
    refetch: fetchQuizzes,
    deleteQuiz,
    createQuiz,
  };
}
