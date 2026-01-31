export interface ApiResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export interface CreateGameRequest {
  quizId: string;
}

export interface CreateGameResponse {
  sessionId: string;
  pin: string;
}

export interface JoinGameRequest {
  pin: string;
  nickname: string;
}

export interface JoinGameResponse {
  playerId: string;
  sessionId: string;
  token: string;
}
