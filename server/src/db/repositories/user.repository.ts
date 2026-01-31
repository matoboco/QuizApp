import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../connection';
import { User } from '@shared/types';

interface UserRow {
  id: string;
  email: string;
  username: string;
  password_hash: string;
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  findById(id: string): User | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  }

  findByEmail(email: string): User | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  }

  findByUsername(username: string): User | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
    return row ? rowToUser(row) : undefined;
  }

  create(data: CreateUserData): User {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO users (id, email, username, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, data.email, data.username, data.passwordHash, now, now);

    return {
      id,
      email: data.email,
      username: data.username,
      passwordHash: data.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
  }

  existsByEmail(email: string): boolean {
    const db = getDb();
    const row = db.prepare('SELECT 1 FROM users WHERE email = ?').get(email);
    return !!row;
  }

  existsByUsername(username: string): boolean {
    const db = getDb();
    const row = db.prepare('SELECT 1 FROM users WHERE username = ?').get(username);
    return !!row;
  }
}
