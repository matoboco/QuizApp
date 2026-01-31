import { Request, Response, NextFunction } from 'express';
import { ApiResponse, CreateGameResponse, JoinGameResponse, GameSession, Player, HostTokenPayload } from '@shared/types';
import { gameService } from './game.service';
import { CreateGameInput, JoinGameInput } from './game.validation';

export async function createGame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { quizId }: CreateGameInput = req.body;
    const host = req.user as HostTokenPayload;

    const result = await gameService.createGame(host.userId, quizId);

    const response: ApiResponse<CreateGameResponse> = {
      success: true,
      data: result,
      message: 'Game session created',
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function joinGame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { pin, nickname }: JoinGameInput = req.body;

    const result = await gameService.joinGame(pin, nickname);

    const response: ApiResponse<JoinGameResponse> = {
      success: true,
      data: result,
      message: 'Joined game successfully',
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getGame(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = req.params.id;

    const result = gameService.getGameSession(sessionId);

    const response: ApiResponse<{ session: GameSession; players: Player[] }> = {
      success: true,
      data: result,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
