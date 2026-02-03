import { z } from 'zod';
import {
  MIN_TIME_LIMIT,
  MAX_TIME_LIMIT,
  MIN_ANSWERS,
  MAX_ANSWERS,
  QUESTION_TYPES,
} from '@shared/types';
import type { QuestionType } from '@shared/types';

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
  description: z
    .string()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('')),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  questionType: z.enum(QUESTION_TYPES as [QuestionType, ...QuestionType[]]).default('multiple-choice'),
  requireAll: z.boolean().default(false),
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
    .max(MAX_ANSWERS, `At most ${MAX_ANSWERS} answers are allowed`),
  correctNumber: z.number().optional(),
  tolerance: z.number().positive('Tolerance must be positive').optional(),
}).superRefine((data, ctx) => {
  const { questionType, answers } = data;

  if (questionType === 'number-guess') {
    if (data.correctNumber === undefined || data.correctNumber === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Number guess questions require a correct number' });
    }
    if (data.tolerance === undefined || data.tolerance === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Number guess questions require a tolerance' });
    }
    // answers can be empty for number-guess
    return;
  }

  if (answers.length < MIN_ANSWERS) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: `At least ${MIN_ANSWERS} answers are required` });
  }

  switch (questionType) {
    case 'true-false':
      if (answers.length !== 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'True/False questions must have exactly 2 answers' });
      }
      if (answers.filter((a) => a.isCorrect).length !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'True/False questions must have exactly 1 correct answer' });
      }
      break;

    case 'multiple-choice':
      if (answers.length < 2 || answers.length > 4) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Multiple choice questions must have 2-4 answers' });
      }
      if (answers.filter((a) => a.isCorrect).length !== 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Multiple choice questions must have exactly 1 correct answer' });
      }
      break;

    case 'multi-select':
      if (answers.filter((a) => a.isCorrect).length < 1) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Multi-select questions must have at least 1 correct answer' });
      }
      break;

    case 'ordering':
      // For ordering, all answers define the correct order via orderIndex
      // No isCorrect validation needed
      break;
  }
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
