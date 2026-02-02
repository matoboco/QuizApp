export type QuestionType = 'multiple-choice' | 'true-false' | 'multi-select' | 'ordering';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  hostId: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  questions: Question[];
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string;
  isPublished: boolean;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  quizId: string;
  text: string;
  imageUrl?: string;
  questionType: QuestionType;
  requireAll: boolean; // multi-select: require all correct answers
  timeLimit: number; // seconds
  points: number;
  orderIndex: number;
  answers: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface CreateQuizRequest {
  title: string;
  description?: string;
}

export interface UpdateQuizRequest {
  title?: string;
  description?: string;
  isPublished?: boolean;
  questions?: CreateQuestionInput[];
}

export interface CreateQuestionInput {
  id?: string;
  text: string;
  imageUrl?: string;
  questionType?: QuestionType;
  requireAll?: boolean;
  timeLimit: number;
  points: number;
  orderIndex: number;
  answers: CreateAnswerInput[];
}

export interface CreateAnswerInput {
  id?: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export const ANSWER_COLORS = [
  '#e21b3c', // red
  '#1368ce', // blue
  '#d89e00', // gold
  '#26890c', // green
  '#9b2fae', // purple
  '#d35400', // orange
  '#0097a7', // teal
  '#c2185b', // pink
] as const;
export const ANSWER_SHAPES = ['triangle', 'diamond', 'circle', 'square', 'hexagon', 'star', 'pentagon', 'heart'] as const;
export type AnswerShape = typeof ANSWER_SHAPES[number];

export const DEFAULT_TIME_LIMIT = 20;
export const MIN_TIME_LIMIT = 5;
export const MAX_TIME_LIMIT = 120;
export const DEFAULT_POINTS = 1000;
export const MIN_ANSWERS = 2;
export const MAX_ANSWERS = 8;
export const QUESTION_TYPES: QuestionType[] = ['multiple-choice', 'true-false', 'multi-select', 'ordering'];
