import { Router } from 'express';
import { authenticate, requireHost } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createQuizSchema, updateQuizSchema } from './quiz.validation';
import {
  createQuiz,
  getQuizzes,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  getPublicQuizzes,
  getPublicQuiz,
  duplicateQuiz,
} from './quiz.controller';

const quizRouter = Router();

// All quiz routes require authentication and host role
quizRouter.use(authenticate, requireHost);

// Public quiz routes (must be before /:id to avoid conflict)
quizRouter.get('/public', getPublicQuizzes);
quizRouter.get('/public/:id', getPublicQuiz);

quizRouter.post('/', validate(createQuizSchema), createQuiz);
quizRouter.get('/', getQuizzes);
quizRouter.get('/:id', getQuiz);
quizRouter.put('/:id', validate(updateQuizSchema), updateQuiz);
quizRouter.delete('/:id', deleteQuiz);
quizRouter.post('/:id/duplicate', duplicateQuiz);

export { quizRouter };
