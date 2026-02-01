export interface User {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserPublic {
  id: string;
  email: string;
  username: string;
  emailVerified: boolean;
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

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendCodeRequest {
  email: string;
}

export interface AuthPendingVerification {
  requiresVerification: true;
  email: string;
  message: string;
}

export type AuthResult = AuthResponse | AuthPendingVerification;

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
