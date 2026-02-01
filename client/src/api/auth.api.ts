import apiClient from './client';
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthPendingVerification,
  AuthResult,
  VerifyEmailRequest,
  ResendCodeRequest,
  UserPublic,
} from '@shared/types/auth';
import type { ApiResponse } from '@shared/types/api';

export async function loginApi(data: LoginRequest): Promise<AuthResult> {
  const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', data);
  return response.data.data!;
}

export async function registerApi(data: RegisterRequest): Promise<AuthPendingVerification> {
  const response = await apiClient.post<ApiResponse<AuthPendingVerification>>('/auth/register', data);
  return response.data.data!;
}

export async function verifyEmailApi(data: VerifyEmailRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify', data);
  return response.data.data!;
}

export async function resendCodeApi(data: ResendCodeRequest): Promise<void> {
  await apiClient.post<ApiResponse>('/auth/resend-code', data);
}

export async function getMeApi(): Promise<UserPublic> {
  const response = await apiClient.get<ApiResponse<UserPublic>>('/auth/me');
  return response.data.data!;
}
