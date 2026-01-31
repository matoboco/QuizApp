import apiClient from './client';
import type {
  CreateGameRequest,
  CreateGameResponse,
  JoinGameRequest,
  JoinGameResponse,
  ApiResponse,
} from '@shared/types/api';
import type { GameSession } from '@shared/types/game';

export async function createGameApi(quizId: string): Promise<CreateGameResponse> {
  const response = await apiClient.post<ApiResponse<CreateGameResponse>>('/games', {
    quizId,
  } satisfies CreateGameRequest);
  return response.data.data!;
}

export async function joinGameApi(
  pin: string,
  nickname: string
): Promise<JoinGameResponse> {
  const response = await apiClient.post<ApiResponse<JoinGameResponse>>('/games/join', {
    pin,
    nickname,
  } satisfies JoinGameRequest);
  return response.data.data!;
}

export async function getGameApi(sessionId: string): Promise<GameSession> {
  const response = await apiClient.get<ApiResponse<GameSession>>(
    `/games/${sessionId}`
  );
  return response.data.data!;
}
