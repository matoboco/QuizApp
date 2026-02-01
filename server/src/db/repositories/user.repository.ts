import { v4 as uuidv4 } from 'uuid';
import { getKysely } from '../connection';
import { User } from '@shared/types';

interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
  email_verified: number;
  created_at: string;
  updated_at: string;
}

interface CreateUserData {
  email: string;
  username: string;
  passwordHash: string;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    passwordHash: row.password_hash,
    emailVerified: row.email_verified === 1,
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

    await db
      .insertInto('users')
      .values({
        id,
        email: data.email,
        username: data.username,
        password_hash: data.passwordHash,
        email_verified: 0,
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
}
