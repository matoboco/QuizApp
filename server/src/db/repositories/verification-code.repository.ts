import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../connection';

interface VerificationCodeRow {
  id: string;
  user_id: string;
  email: string;
  code: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface VerificationCode {
  id: string;
  userId: string;
  email: string;
  code: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

function rowToVerificationCode(row: VerificationCodeRow): VerificationCode {
  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    code: row.code,
    expiresAt: row.expires_at,
    usedAt: row.used_at,
    createdAt: row.created_at,
  };
}

export class VerificationCodeRepository {
  create(userId: string, email: string, code: string, expiresAt: string): VerificationCode {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO email_verification_codes (id, user_id, email, code, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, userId, email, code, expiresAt, now);

    return {
      id,
      userId,
      email,
      code,
      expiresAt,
      usedAt: null,
      createdAt: now,
    };
  }

  findLatestUnusedByEmail(email: string): VerificationCode | undefined {
    const db = getDb();
    const row = db.prepare(
      `SELECT * FROM email_verification_codes
       WHERE email = ? AND used_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`
    ).get(email) as VerificationCodeRow | undefined;

    return row ? rowToVerificationCode(row) : undefined;
  }

  markUsed(id: string): void {
    const db = getDb();
    db.prepare('UPDATE email_verification_codes SET used_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id);
  }

  invalidateAllForUser(userId: string): void {
    const db = getDb();
    db.prepare(
      `UPDATE email_verification_codes SET used_at = ? WHERE user_id = ? AND used_at IS NULL`
    ).run(new Date().toISOString(), userId);
  }
}
