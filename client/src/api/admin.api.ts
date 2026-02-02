import client from './client';
import type { AdminUserListResponse, AdminUserView, AdminStats } from '@shared/types';

export async function getAdminUsersApi(
  page = 1,
  pageSize = 20,
  search?: string
): Promise<AdminUserListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.append('search', search);

  const response = await client.get(`/admin/users?${params}`);
  return response.data.data!;
}

export async function getAdminUserApi(userId: string): Promise<AdminUserView> {
  const response = await client.get(`/admin/users/${userId}`);
  return response.data.data!;
}

export async function deactivateUserApi(userId: string): Promise<void> {
  await client.post(`/admin/users/${userId}/deactivate`);
}

export async function activateUserApi(userId: string): Promise<void> {
  await client.post(`/admin/users/${userId}/activate`);
}

export async function resetPasswordApi(userId: string): Promise<void> {
  await client.post(`/admin/users/${userId}/reset-password`);
}

export async function changeUserEmailApi(userId: string, email: string): Promise<void> {
  await client.put(`/admin/users/${userId}/email`, { email });
}

export async function deleteUserApi(userId: string): Promise<void> {
  await client.delete(`/admin/users/${userId}`);
}

export async function setUserRoleApi(userId: string, role: 'user' | 'admin'): Promise<void> {
  await client.put(`/admin/users/${userId}/role`, { role });
}

export async function getAdminStatsApi(): Promise<AdminStats> {
  const response = await client.get('/admin/stats');
  return response.data.data!;
}
