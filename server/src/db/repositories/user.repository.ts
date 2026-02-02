import { v4 as uuidv4 } from 'uuid';
import { sql } from 'kysely';
import { getKysely } from '../connection';
import { User, UserRole } from '@shared/types';

interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  email_verified: number;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
  role?: UserRole;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    emailVerified: row.email_verified === 1,
    role: (row.role || 'user') as UserRole,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  async findById(id: string): Promise<User | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? rowToUser(row as UserRow) : undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();
    return row ? rowToUser(row as UserRow) : undefined;
  }

  async findByUsername(username: string): Promise<User | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();
    return row ? rowToUser(row as UserRow) : undefined;
  }

  async create(data: CreateUserData): Promise<User> {
    const db = getKysely();
    const id = uuidv4();
    const now = new Date().toISOString();
    const role = data.role || 'user';

    await db
      .insertInto('users')
      .values({
        id,
        email: data.email,
        username: data.username,
        password_hash: data.passwordHash,
        email_verified: 0,
        role,
        is_active: 1,
        created_at: now,
        updated_at: now,
      })
      .execute();

    return {
      id,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      emailVerified: false,
      role: role as UserRole,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
  }

  async markEmailVerified(userId: string): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('users')
      .set({ email_verified: 1, updated_at: new Date().toISOString() })
      .where('id', '=', userId)
      .execute();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const db = getKysely();
    const row = await db
      .selectFrom('users')
      .select('id')
      .where('email', '=', email)
      .executeTakeFirst();
    return !!row;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const db = getKysely();
    const row = await db
      .selectFrom('users')
      .select('id')
      .where('username', '=', username)
      .executeTakeFirst();
    return !!row;
  }

  async count(): Promise<number> {
    const db = getKysely();
    const result = await db
      .selectFrom('users')
      .select(sql<number>`count(*)`.as('count'))
      .executeTakeFirst();
    return Number(result?.count ?? 0);
  }

  async findAll(options: {
    page: number;
    pageSize: number;
    search?: string;
  }): Promise<{ users: User[]; total: number }> {
    const db = getKysely();
    const { page, pageSize, search } = options;
    const offset = (page - 1) * pageSize;

    let query = db.selectFrom('users').selectAll();
    let countQuery = db.selectFrom('users').select(sql<number>`count(*)`.as('count'));

    if (search) {
      const searchPattern = `%${search}%`;
      query = query.where((eb) =>
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
      query
        .orderBy('created_at', 'desc')
        .limit(pageSize)
        .offset(offset)
        .execute(),
      countQuery.executeTakeFirst(),
    ]);

    return {
      users: rows.map((row) => rowToUser(row as UserRow)),
      total: Number(countResult?.count ?? 0),
    };
  }

  async updateRole(userId: string, role: UserRole): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('users')
      .set({ role, updated_at: new Date().toISOString() })
      .where('id', '=', userId)
      .execute();
  }

  async setActive(userId: string, isActive: boolean): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('users')
      .set({ is_active: isActive ? 1 : 0, updated_at: new Date().toISOString() })
      .where('id', '=', userId)
      .execute();
  }

  async updateEmail(userId: string, email: string): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('users')
      .set({ email, updated_at: new Date().toISOString() })
      .where('id', '=', userId)
      .execute();
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('users')
      .set({ password_hash: passwordHash, updated_at: new Date().toISOString() })
      .where('id', '=', userId)
      .execute();
  }

  async delete(userId: string): Promise<void> {
    const db = getKysely();
    await db
      .deleteFrom('users')
      .where('id', '=', userId)
      .execute();
  }
}
