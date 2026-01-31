import { z } from 'zod';

export const createGameSchema = z.object({
  quizId: z
    .string()
    .min(1, 'Quiz ID is required'),
});

export const joinGameSchema = z.object({
  pin: z
    .string()
    .length(6, 'PIN must be exactly 6 characters'),
  nickname: z
    .string()
    .trim()
    .min(1, 'Nickname is required')
    .max(30, 'Nickname must be at most 30 characters'),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type JoinGameInput = z.infer<typeof joinGameSchema>;
