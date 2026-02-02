import { Request, Response, NextFunction } from 'express';
import { historyService } from './history.service';
import {
  ApiResponse,
  HostTokenPayload,
  GameHistorySummary,
  GameHistoryDetail,
  QuestionStats,
  RankingSnapshot,
  ShareTokenResponse,
} from '@shared/types';

export async function getGamesByQuizId(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { quizId } = req.params;
    const hostId = (req.user as HostTokenPayload).userId;

    const games = await historyService.getGamesByQuizId(quizId, hostId);

    const response: ApiResponse<GameHistorySummary[]> = {
      success: true,
      data: games,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getGameDetails(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const shareToken = req.query.token as string | undefined;

    // If authenticated, use userId; otherwise null
    const hostId = req.user?.type === 'host' ? (req.user as HostTokenPayload).userId : null;

    const game = await historyService.getGameDetails(gameId, hostId, shareToken);

    const response: ApiResponse<GameHistoryDetail> = {
      success: true,
      data: game,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getQuestionStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId, questionIndex } = req.params;
    const shareToken = req.query.token as string | undefined;

    const hostId = req.user?.type === 'host' ? (req.user as HostTokenPayload).userId : null;

    const stats = await historyService.getQuestionStats(
      gameId,
      parseInt(questionIndex),
      hostId,
      shareToken
    );

    const response: ApiResponse<QuestionStats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getRankingProgression(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const shareToken = req.query.token as string | undefined;

    const hostId = req.user?.type === 'host' ? (req.user as HostTokenPayload).userId : null;

    const rankings = await historyService.getRankingProgression(gameId, hostId, shareToken);

    const response: ApiResponse<RankingSnapshot[]> = {
      success: true,
      data: rankings,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function generateShareToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { gameId } = req.params;
    const hostId = (req.user as HostTokenPayload).userId;

    const shareToken = await historyService.generateShareToken(gameId, hostId);

    // Build share URL
    const protocol = req.protocol;
    const host = req.get('host');
    const shareUrl = `${protocol}://${host}/shared/${shareToken}`;

    const response: ApiResponse<ShareTokenResponse> = {
      success: true,
      data: { shareToken, shareUrl },
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getGameByShareToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { shareToken } = req.params;

    const game = await historyService.getGameByShareToken(shareToken);

    const response: ApiResponse<GameHistoryDetail> = {
      success: true,
      data: game,
    };
    res.json(response);
  } catch (err) {
    next(err);
  }
}
