import { v4 as uuidv4 } from 'uuid';
import { getKysely } from '../connection';

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
  async create(userId: string, email: string, code: string, expiresAt: string): Promise<VerificationCode> {
    const db = getKysely();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db
      .insertInto('email_verification_codes')
      .values({
        id,
        user_id: userId,
        email,
        code,
        expires_at: expiresAt,
        created_at: now,
      })
      .execute();

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

  async findLatestUnusedByEmail(email: string): Promise<VerificationCode | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('email_verification_codes')
      .selectAll()
      .where('email', '=', email)
      .where('used_at', 'is', null)
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();

    return row ? rowToVerificationCode(row as VerificationCodeRow) : undefined;
  }

  async markUsed(id: string): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('email_verification_codes')
      .set({ used_at: new Date().toISOString() })
      .where('id', '=', id)
      .execute();
  }

  async invalidateAllForUser(userId: string): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('email_verification_codes')
      .set({ used_at: new Date().toISOString() })
      .where('user_id', '=', userId)
      .where('used_at', 'is', null)
      .execute();
  }
}
