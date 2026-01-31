import { useState, useEffect, useCallback, useRef } from 'react';
import { getQuizApi, updateQuizApi } from '@/api/quiz.api';
import type {
  Quiz,
  Question,
  Answer,
  UpdateQuizRequest,
  CreateQuestionInput,
  CreateAnswerInput,
  QuestionType,
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

function createDefaultAnswers(questionId: string, questionType: QuestionType): Answer[] {
  switch (questionType) {
    case 'true-false':
      return [
        { id: generateId('a'), questionId, text: 'True', isCorrect: true, orderIndex: 0 },
        { id: generateId('a'), questionId, text: 'False', isCorrect: false, orderIndex: 1 },
      ];
    case 'multi-select':
    case 'ordering':
    case 'multiple-choice':
    default:
      return [
        createEmptyAnswer(questionId, 0),
        createEmptyAnswer(questionId, 1),
      ];
  }
}

function createEmptyQuestion(quizId: string, orderIndex: number, questionType: QuestionType = 'multiple-choice'): Question {
  const questionId = generateId('q');
  return {
    id: questionId,
    quizId,
    text: '',
    imageUrl: undefined,
    questionType,
    requireAll: false,
    timeLimit: DEFAULT_TIME_LIMIT,
    points: DEFAULT_POINTS,
    orderIndex,
    answers: createDefaultAnswers(questionId, questionType),
  };
}

export type ValidationErrors = Record<number, string[]>;

function validateQuiz(quiz: Quiz): ValidationErrors {
  const errors: ValidationErrors = {};

  quiz.questions.forEach((q, i) => {
    const qErrors: string[] = [];

    if (!q.text.trim()) {
      qErrors.push('Question text is required');
    }

    const emptyAnswers = q.answers.filter((a) => !a.text.trim());
    if (emptyAnswers.length > 0) {
      qErrors.push('All answers must have text');
    }

    const correctCount = q.answers.filter((a) => a.isCorrect).length;

    switch (q.questionType) {
      case 'true-false':
      case 'multiple-choice':
        if (correctCount === 0) {
          qErrors.push('Select a correct answer');
        } else if (correctCount > 1) {
          qErrors.push('Only 1 correct answer is allowed');
        }
        break;
      case 'multi-select':
        if (correctCount === 0) {
          qErrors.push('Select at least 1 correct answer');
        }
        break;
      case 'ordering':
        break;
    }

    if (qErrors.length > 0) {
      errors[i] = qErrors;
    }
  });

  return errors;
}

export interface UseQuizEditorReturn {
  quiz: Quiz | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
  validationErrors: ValidationErrors;
  updateTitle: (title: string) => void;
  updateDescription: (description: string) => void;
  updatePublished: (isPublished: boolean) => void;
  addQuestion: (questionType?: QuestionType) => void;
  changeQuestionType: (index: number, questionType: QuestionType) => void;
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
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
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

  const addQuestion = useCallback((questionType: QuestionType = 'multiple-choice') => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const newQuestion = createEmptyQuestion(prev.id, prev.questions.length, questionType);
      return { ...prev, questions: [...prev.questions, newQuestion] };
    });
    setIsDirty(true);
  }, []);

  const changeQuestionType = useCallback((index: number, questionType: QuestionType) => {
    setQuiz((prev) => {
      if (!prev) return prev;
      const questions = [...prev.questions];
      const question = questions[index];
      const newAnswers = createDefaultAnswers(question.id, questionType);
      questions[index] = {
        ...question,
        questionType,
        requireAll: false,
        answers: newAnswers,
      };
      return { ...prev, questions };
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
      const maxAnswers = question.questionType === 'true-false' ? 2
        : (question.questionType === 'multi-select' || question.questionType === 'ordering') ? 8
        : 4;
      if (question.answers.length >= maxAnswers) return prev;
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

    const vErrors = validateQuiz(quiz);
    setValidationErrors(vErrors);
    if (Object.keys(vErrors).length > 0) {
      const count = Object.keys(vErrors).length;
      throw new Error(`${count} ${count === 1 ? 'question has' : 'questions have'} validation errors`);
    }

    try {
      setError(null);
      const questionsPayload: CreateQuestionInput[] = quiz.questions.map((q) => ({
        id: q.id,
        text: q.text,
        imageUrl: q.imageUrl,
        questionType: q.questionType,
        requireAll: q.requireAll,
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
    validationErrors,
    updateTitle,
    updateDescription,
    updatePublished,
    addQuestion,
    changeQuestionType,
    removeQuestion,
    updateQuestion,
    moveQuestion,
    addAnswer,
    removeAnswer,
    updateAnswer,
    save,
  };
}
