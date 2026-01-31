import { Router } from 'express';
import { createGame, joinGame, getGame } from './game.controller';
import { authenticate, requireHost } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createGameSchema, joinGameSchema } from './game.validation';

const gameRouter = Router();

gameRouter.post('/', authenticate, requireHost, validate(createGameSchema), createGame);
gameRouter.post('/join', validate(joinGameSchema), joinGame);
gameRouter.get('/:id', authenticate, requireHost, getGame);

export { gameRouter };
