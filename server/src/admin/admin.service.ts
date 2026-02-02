import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sql } from 'kysely';
import { getKysely } from '../db/connection';
import { userRepository } from '../db/repositories';
import { AdminUserView, AdminStats, UserRole } from '@shared/types';
import { BadRequestError, NotFoundError } from '../middleware/error.middleware';
import { sendPasswordResetEmail } from '../auth/email.service';

const BCRYPT_ROUNDS = 10;

class AdminService {
  async getUsers(options: {
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<{ users: AdminUserView[]; total: number }> {
    const db = getKysely();
    const { page, pageSize, search } = options;
    const offset = (page - 1) * pageSize;

    // Get users
    let usersQuery = db
      .selectFrom('users')
      .selectAll()
      .orderBy('created_at', 'desc')
      .limit(pageSize)
      .offset(offset);

    let countQuery = db
      .selectFrom('users')
      .select(sql<number>`count(*)`.as('count'));

    if (search) {
      const searchPattern = `%${search}%`;
      usersQuery = usersQuery.where((eb) =>
        eb.or([
          eb('email', 'like', searchPattern),
          eb('username', 'like', searchPattern),
        ])
      );
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('email', 'like', searchPattern),
          eb('username', 'like', searchPattern),
        ])
      );
    }

    const [rows, countResult] = await Promise.all([
      usersQuery.execute(),
      countQuery.executeTakeFirst(),
    ]);

    // Get quiz and game counts for each user
    const userIds = rows.map((r: any) => r.id);

    const quizCounts = userIds.length > 0
      ? await db
          .selectFrom('quizzes')
          .select(['host_id', sql<number>`count(*)`.as('count')])
          .where('host_id', 'in', userIds)
          .groupBy('host_id')
          .execute()
      : [];

    const gameCounts = userIds.length > 0
      ? await db
          .selectFrom('game_sessions')
          .select(['host_id', sql<number>`count(*)`.as('count')])
          .where('host_id', 'in', userIds)
          .groupBy('host_id')
          .execute()
      : [];

    const quizCountMap = new Map(quizCounts.map((q: any) => [q.host_id, Number(q.count)]));
    const gameCountMap = new Map(gameCounts.map((g: any) => [g.host_id, Number(g.count)]));

    const users: AdminUserView[] = rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      username: row.username,
      role: (row.role || 'user') as UserRole,
      isActive: row.is_active === 1,
      emailVerified: row.email_verified === 1,
      createdAt: row.created_at,
      quizCount: quizCountMap.get(row.id) ?? 0,
      gameCount: gameCountMap.get(row.id) ?? 0,
    }));

    return { users, total: Number(countResult?.count ?? 0) };
  }

  async getUserById(userId: string): Promise<AdminUserView> {
    const db = getKysely();

    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    if (!row) {
      throw new NotFoundError('User not found');
    }

    // Get counts
    const [quizCount, gameCount] = await Promise.all([
      db.selectFrom('quizzes').select(sql<number>`count(*)`.as('count')).where('host_id', '=', userId).executeTakeFirst(),
      db.selectFrom('game_sessions').select(sql<number>`count(*)`.as('count')).where('host_id', '=', userId).executeTakeFirst(),
    ]);

    return {
      id: row.id as string,
      email: row.email as string,
      username: row.username as string,
      role: ((row.role as string) || 'user') as UserRole,
      isActive: (row.is_active as number) === 1,
      emailVerified: (row.email_verified as number) === 1,
      createdAt: row.created_at as string,
      quizCount: Number(quizCount?.count ?? 0),
      gameCount: Number(gameCount?.count ?? 0),
    };
  }

  async deactivateUser(userId: string, adminId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (userId === adminId) {
      throw new BadRequestError('Cannot deactivate your own account');
    }

    if (user.role === 'superadmin') {
      throw new BadRequestError('Cannot deactivate a superadmin');
    }

    await userRepository.setActive(userId, false);
  }

  async activateUser(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await userRepository.setActive(userId, true);
  }

  async resetPassword(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate a random temporary password
    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    await userRepository.updatePassword(userId, passwordHash);

    // Send email with new password
    await sendPasswordResetEmail(user.email, tempPassword);
  }

  async changeEmail(userId: string, newEmail: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if email is already taken
    const existingUser = await userRepository.findByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestError('Email is already in use');
    }

    await userRepository.updateEmail(userId, newEmail);
  }

  async deleteUser(userId: string, adminId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (userId === adminId) {
      throw new BadRequestError('Cannot delete your own account');
    }

    if (user.role === 'superadmin') {
      throw new BadRequestError('Cannot delete a superadmin');
    }

    await userRepository.delete(userId);
  }

  async setUserRole(userId: string, role: 'user' | 'admin', adminId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (userId === adminId) {
      throw new BadRequestError('Cannot change your own role');
    }

    if (user.role === 'superadmin') {
      throw new BadRequestError('Cannot change the role of a superadmin');
    }

    await userRepository.updateRole(userId, role);
  }

  async getStats(): Promise<AdminStats> {
    const db = getKysely();

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [totalUsers, activeUsers, totalQuizzes, totalGames, gamesThisWeek] = await Promise.all([
      db.selectFrom('users').select(sql<number>`count(*)`.as('count')).executeTakeFirst(),
      db.selectFrom('users').select(sql<number>`count(*)`.as('count')).where('is_active', '=', 1).executeTakeFirst(),
      db.selectFrom('quizzes').select(sql<number>`count(*)`.as('count')).executeTakeFirst(),
      db.selectFrom('game_sessions').select(sql<number>`count(*)`.as('count')).executeTakeFirst(),
      db.selectFrom('game_sessions').select(sql<number>`count(*)`.as('count')).where('created_at', '>=', oneWeekAgo).executeTakeFirst(),
    ]);

    return {
      totalUsers: Number(totalUsers?.count ?? 0),
      activeUsers: Number(activeUsers?.count ?? 0),
      totalQuizzes: Number(totalQuizzes?.count ?? 0),
      totalGames: Number(totalGames?.count ?? 0),
      gamesThisWeek: Number(gamesThisWeek?.count ?? 0),
    };
  }
}

export const adminService = new AdminService();
