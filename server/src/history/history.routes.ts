import { Router } from 'express';
import { authenticate, requireHost } from '../middleware/auth.middleware';
import {
  getGamesByQuizId,
  getGameDetails,
  getQuestionStats,
  getRankingProgression,
  generateShareToken,
  getGameByShareToken,
} from './history.controller';

const historyRouter = Router();

// Optional authentication middleware - sets req.user if token present, doesn't fail otherwise
function optionalAuth(req: any, res: any, next: any): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  // Try to authenticate but don't fail if invalid
  authenticate(req, res, (err?: any) => {
    // Ignore auth errors for optional auth
    next();
  });
}

// Public route - access via share token
historyRouter.get('/shared/:shareToken', getGameByShareToken);

// Routes that can be accessed with auth OR share token
historyRouter.get('/games/:gameId', optionalAuth, getGameDetails);
historyRouter.get('/games/:gameId/questions/:questionIndex', optionalAuth, getQuestionStats);
historyRouter.get('/games/:gameId/rankings', optionalAuth, getRankingProgression);

// Protected routes - require host authentication
historyRouter.get('/quizzes/:quizId/games', authenticate, requireHost, getGamesByQuizId);
historyRouter.post('/games/:gameId/share', authenticate, requireHost, generateShareToken);

export { historyRouter };
