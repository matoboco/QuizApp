import { v4 as uuidv4 } from 'uuid';
import { sql } from 'kysely';
import { getKysely } from '../connection';
import { Player } from '@shared/types';

interface PlayerRow {
  id: string;
  session_id: string;
  nickname: string;
  score: number;
  streak: number;
  is_connected: number;
  joined_at: string;
}

interface CreatePlayerData {
  sessionId: string;
  nickname: string;
}

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    sessionId: row.session_id,
    nickname: row.nickname,
    score: row.score,
    streak: row.streak,
    isConnected: row.is_connected === 1,
    joinedAt: row.joined_at,
  };
}

export class PlayerRepository {
  async findById(id: string): Promise<Player | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('players')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? rowToPlayer(row as PlayerRow) : undefined;
  }

  async findBySessionId(sessionId: string): Promise<Player[]> {
    const db = getKysely();
    const rows = await db
      .selectFrom('players')
      .selectAll()
      .where('session_id', '=', sessionId)
      .orderBy('score', 'desc')
      .orderBy('joined_at', 'asc')
      .execute();
    return rows.map((row) => rowToPlayer(row as PlayerRow));
  }

  async create(data: CreatePlayerData): Promise<Player> {
    const db = getKysely();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db
      .insertInto('players')
      .values({
        id,
        session_id: data.sessionId,
        nickname: data.nickname,
        score: 0,
        streak: 0,
        is_connected: 1,
        joined_at: now,
      })
      .execute();

    return {
      id,
      sessionId: data.sessionId,
      nickname: data.nickname,
      score: 0,
      streak: 0,
      isConnected: true,
      joinedAt: now,
    };
  }

  async updateScore(id: string, score: number, streak: number): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('players')
      .set({ score, streak })
      .where('id', '=', id)
      .execute();
  }

  async updateScoreBatch(updates: { id: string; score: number; streak: number }[]): Promise<void> {
    if (updates.length === 0) return;
    const db = getKysely();
    await db.transaction().execute(async (trx) => {
      for (const update of updates) {
        await trx
          .updateTable('players')
          .set({ score: update.score, streak: update.streak })
          .where('id', '=', update.id)
          .execute();
      }
    });
  }

  async setConnected(id: string, connected: boolean): Promise<void> {
    const db = getKysely();
    await db
      .updateTable('players')
      .set({ is_connected: connected ? 1 : 0 })
      .where('id', '=', id)
      .execute();
  }

  async deleteBySessionId(sessionId: string): Promise<number> {
    const db = getKysely();
    const result = await db
      .deleteFrom('players')
      .where('session_id', '=', sessionId)
      .executeTakeFirst();
    return Number(result.numDeletedRows);
  }

  async existsNicknameInSession(sessionId: string, nickname: string): Promise<boolean> {
    const db = getKysely();
    const row = await db
      .selectFrom('players')
      .select('id')
      .where('session_id', '=', sessionId)
      .where(sql`LOWER(nickname)`, '=', nickname.toLowerCase())
      .executeTakeFirst();
    return !!row;
  }
}
