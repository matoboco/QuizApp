import apiClient from './client';
import type { Quiz, QuizSummary, CreateQuizRequest, UpdateQuizRequest } from '@shared/types/quiz';
import type { ApiResponse } from '@shared/types/api';

export async function getQuizzesApi(): Promise<QuizSummary[]> {
  const response = await apiClient.get<ApiResponse<QuizSummary[]>>('/quizzes');
  return response.data.data!;
}

export async function getQuizApi(id: string): Promise<Quiz> {
  const response = await apiClient.get<ApiResponse<Quiz>>(`/quizzes/${id}`);
  return response.data.data!;
}

export async function createQuizApi(data: CreateQuizRequest): Promise<Quiz> {
  const response = await apiClient.post<ApiResponse<Quiz>>('/quizzes', data);
  return response.data.data!;
}

export async function updateQuizApi(id: string, data: UpdateQuizRequest): Promise<Quiz> {
  const response = await apiClient.put<ApiResponse<Quiz>>(`/quizzes/${id}`, data);
  return response.data.data!;
}

export async function deleteQuizApi(id: string): Promise<void> {
  await apiClient.delete(`/quizzes/${id}`);
}
