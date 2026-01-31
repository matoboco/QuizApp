import { z } from 'zod';
import {
  MIN_TIME_LIMIT,
  MAX_TIME_LIMIT,
  MIN_ANSWERS,
  MAX_ANSWERS,
} from '@shared/types';

export const answerInputSchema = z.object({
  id: z.string().optional(),
  text: z
    .string()
    .min(1, 'Answer text is required')
    .max(500, 'Answer text must be at most 500 characters'),
  isCorrect: z.boolean(),
  orderIndex: z.number().int().min(0),
});

export const questionInputSchema = z.object({
  id: z.string().optional(),
  text: z
    .string()
    .min(1, 'Question text is required'),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  timeLimit: z
    .number()
    .int()
    .min(MIN_TIME_LIMIT, `Time limit must be at least ${MIN_TIME_LIMIT} seconds`)
    .max(MAX_TIME_LIMIT, `Time limit must be at most ${MAX_TIME_LIMIT} seconds`),
  points: z
    .number()
    .int()
    .min(100, 'Points must be at least 100')
    .max(2000, 'Points must be at most 2000'),
  orderIndex: z.number().int().min(0),
  answers: z
    .array(answerInputSchema)
    .min(MIN_ANSWERS, `At least ${MIN_ANSWERS} answers are required`)
    .max(MAX_ANSWERS, `At most ${MAX_ANSWERS} answers are allowed`)
    .refine(
      (answers) => answers.some((a) => a.isCorrect),
      { message: 'At least one answer must be marked as correct' }
    ),
});

export const createQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
});

export const updateQuizSchema = z.object({
  title: z
    .string()
    .min(1, 'Title must not be empty')
    .max(200, 'Title must be at most 200 characters')
    .optional(),
  description: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional(),
  isPublished: z.boolean().optional(),
  questions: z.array(questionInputSchema).optional(),
});

export type CreateQuizInput = z.infer<typeof createQuizSchema>;
export type UpdateQuizInput = z.infer<typeof updateQuizSchema>;
export type QuestionInput = z.infer<typeof questionInputSchema>;
export type AnswerInput = z.infer<typeof answerInputSchema>;
