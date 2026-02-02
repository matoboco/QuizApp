import client from './client';
import type {
  GameHistorySummary,
  GameHistoryDetail,
  QuestionStats,
  RankingSnapshot,
  ShareTokenResponse,
} from '@shared/types';

export async function getQuizGamesHistoryApi(quizId: string): Promise<GameHistorySummary[]> {
  const response = await client.get(`/history/quizzes/${quizId}/games`);
  return response.data.data!;
}

export async function getGameHistoryApi(
  gameId: string,
  shareToken?: string
): Promise<GameHistoryDetail> {
  const params = shareToken ? `?token=${shareToken}` : '';
  const response = await client.get(`/history/games/${gameId}${params}`);
  return response.data.data!;
}

export async function getQuestionStatsApi(
  gameId: string,
  questionIndex: number,
  shareToken?: string
): Promise<QuestionStats> {
  const params = shareToken ? `?token=${shareToken}` : '';
  const response = await client.get(
    `/history/games/${gameId}/questions/${questionIndex}${params}`
  );
  return response.data.data!;
}

export async function getRankingProgressionApi(
  gameId: string,
  shareToken?: string
): Promise<RankingSnapshot[]> {
  const params = shareToken ? `?token=${shareToken}` : '';
  const response = await client.get(`/history/games/${gameId}/rankings${params}`);
  return response.data.data!;
}

export async function generateShareTokenApi(gameId: string): Promise<ShareTokenResponse> {
  const response = await client.post(`/history/games/${gameId}/share`);
  return response.data.data!;
}

export async function getSharedGameApi(shareToken: string): Promise<GameHistoryDetail> {
  const response = await client.get(`/history/shared/${shareToken}`);
  return response.data.data!;
}
