import type { UserRole } from './auth';

export interface AdminUserView {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  quizCount: number;
  gameCount: number;
}

export interface AdminUserListResponse {
  users: AdminUserView[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalQuizzes: number;
  totalGames: number;
  gamesThisWeek: number;
}

export interface UpdateUserRoleRequest {
  role: 'user' | 'admin';
}

export interface UpdateUserEmailRequest {
  email: string;
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
}
