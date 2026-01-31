export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserPublic;
  token: string;
}

export interface HostTokenPayload {
  userId: string;
  email: string;
  type: 'host';
}

export interface PlayerTokenPayload {
  playerId: string;
  sessionId: string;
  type: 'player';
}

export type TokenPayload = HostTokenPayload | PlayerTokenPayload;
