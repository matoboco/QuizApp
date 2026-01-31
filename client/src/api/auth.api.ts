import apiClient from './client';
import type { LoginRequest, RegisterRequest, AuthResponse, UserPublic } from '@shared/types/auth';
import type { ApiResponse } from '@shared/types/api';

export async function loginApi(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
  return response.data.data!;
}

export async function registerApi(data: RegisterRequest): Promise<AuthResponse> {
  const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
  return response.data.data!;
}

export async function getMeApi(): Promise<UserPublic> {
  const response = await apiClient.get<ApiResponse<UserPublic>>('/auth/me');
  return response.data.data!;
}
