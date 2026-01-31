import { useState, useEffect, useCallback, useRef } from 'react';
import { getQuizApi, updateQuizApi } from '@/api/quiz.api';
import type {
  Quiz,
  Question,
  Answer,
  UpdateQuizRequest,
  CreateQuestionInput,
  CreateAnswerInput,
} from '@shared/types/quiz';
import { DEFAULT_TIME_LIMIT, DEFAULT_POINTS } from '@shared/types/quiz';

function generateId(prefix: string): string {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function createEmptyAnswer(questionId: string, orderIndex: number): Answer {
  return {
    id: generateId('a'),
    questionId,
    text: '',
    isCorrect: false,
    orderIndex,
  };
}

function createEmptyQuestion(quizId: string, orderIndex: number): Question {
  const questionId = generateId('q');
  return {
    id: questionId,
    quizId,
    text: '',
    imageUrl: undefined,
    timeLimit: DEFAULT_TIME_LIMIT,
    points: DEFAULT_POINTS,
    orderIndex,
    answers: [
      createEmptyAnswer(questionId, 0),
      createEmptyAnswer(questionId, 1),
    ],
  };
}

export interface UseQuizEditorReturn {
  quiz: Quiz | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  updateTitle: (title: string) => void;
  updateDescription: (description: string) => void;
  updatePublished: (isPublished: boolean) => void;
  addQuestion: () => void;
  removeQuestion: (index: number) => void;
  updateQuestion: (index: number, data: Partial<Question>) => void;
  moveQuestion: (fromIndex: number, toIndex: number) => void;
  addAnswer: (questionIndex: number) => void;
  removeAnswer: (questionIndex: number, answerIndex: number) => void;
  updateAnswer: (questionIndex: number, answerIndex: number, data: Partial<Answer>) => void;
  save: () => Promise<void>;
}

export function useQuizEditor(quizId: string): UseQuizEditorReturn {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const initialLoadDone = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function loadQuiz() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getQuizApi(quizId);
        if (!cancelled) {
          setQuiz(data);
          initialLoadDone.current = true;
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message || 'Failed to load quiz');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    loadQuiz();
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  const updateTitle = useCallback((title: string) => {
    setQuiz((prev) => (prev ? { ...prev, title } : prev));
    setIsDirty(true);
  }, []);

  const updateDescription = useCallback((description: string) => {
    setQuiz((prev) => (prev ? { ...prev, description } : prev));
    setIsDirty(true);
  }, []);

  const updatePublished = useCallback((isPublished: boolean) => {
    setQuiz((prev) => (prev ? { ...prev, isPublished } : prev));
    setIsDirty(true);
  }, []);

  const addQuestion = useCallback(() => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const newQuestion = createEmptyQuestion(prev.id, prev.questions.length);
      return { ...prev, questions: [...prev.questions, newQuestion] };
    });
    setIsDirty(true);
  }, []);

  const removeQuestion = useCallback((index: number) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const updated = prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, orderIndex: i }));
      return { ...prev, questions: updated };
    });
    setIsDirty(true);
  }, []);

  const updateQuestion = useCallback((index: number, data: Partial<Question>) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], ...data };
      return { ...prev, questions };
    });
    setIsDirty(true);
  }, []);

  const moveQuestion = useCallback((fromIndex: number, toIndex: number) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      if (toIndex < 0 || toIndex >= prev.questions.length) return prev;
      const questions = [...prev.questions];
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      const reindexed = questions.map((q, i) => ({ ...q, orderIndex: i }));
      return { ...prev, questions: reindexed };
    });
    setIsDirty(true);
  }, []);

  const addAnswer = useCallback((questionIndex: number) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      const question = questions[questionIndex];
      if (question.answers.length >= 4) return prev;
      const newAnswer = createEmptyAnswer(question.id, question.answers.length);
      questions[questionIndex] = {
        ...question,
        answers: [...question.answers, newAnswer],
      };
      return { ...prev, questions };
    });
    setIsDirty(true);
  }, []);

  const removeAnswer = useCallback((questionIndex: number, answerIndex: number) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      const question = questions[questionIndex];
      if (question.answers.length <= 2) return prev;
      const answers = question.answers
        .filter((_, i) => i !== answerIndex)
        .map((a, i) => ({ ...a, orderIndex: i }));
      questions[questionIndex] = { ...question, answers };
      return { ...prev, questions };
    });
    setIsDirty(true);
  }, []);

  const updateAnswer = useCallback(
    (questionIndex: number, answerIndex: number, data: Partial<Answer>) => {
      setQuiz((prev) => {
        if (!prev) return prev;
        const questions = [...prev.questions];
        const question = questions[questionIndex];
        const answers = [...question.answers];
        answers[answerIndex] = { ...answers[answerIndex], ...data };
        questions[questionIndex] = { ...question, answers };
        return { ...prev, questions };
      });
      setIsDirty(true);
    },
    []
  );

  const save = useCallback(async () => {
    if (!quiz) return;
    try {
      setError(null);
      const questionsPayload: CreateQuestionInput[] = quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        imageUrl: q.imageUrl,
        timeLimit: q.timeLimit,
        points: q.points,
        orderIndex: q.orderIndex,
        answers: q.answers.map(
          (a): CreateAnswerInput => ({
            id: a.id,
            text: a.text,
            isCorrect: a.isCorrect,
            orderIndex: a.orderIndex,
          })
        ),
      }));

      const payload: UpdateQuizRequest = {
        title: quiz.title,
        description: quiz.description,
        isPublished: quiz.isPublished,
        questions: questionsPayload,
      };

      const updated = await updateQuizApi(quiz.id, payload);
      setQuiz(updated);
      setIsDirty(false);
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Failed to save quiz';
      setError(message);
      throw new Error(message);
    }
  }, [quiz]);

  return {
    quiz,
    isLoading,
    error,
    isDirty,
    updateTitle,
    updateDescription,
    updatePublished,
    addQuestion,
    removeQuestion,
    updateQuestion,
    moveQuestion,
    addAnswer,
    removeAnswer,
    updateAnswer,
    save,
  };
}
