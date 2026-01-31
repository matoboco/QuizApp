import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../connection';
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
  findById(id: string): Player | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM players WHERE id = ?').get(id) as PlayerRow | undefined;
    return row ? rowToPlayer(row) : undefined;
  }

  findBySessionId(sessionId: string): Player[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM players WHERE session_id = ? ORDER BY score DESC, joined_at ASC'
    ).all(sessionId) as PlayerRow[];
    return rows.map(rowToPlayer);
  }

  create(data: CreatePlayerData): Player {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO players (id, session_id, nickname, score, streak, is_connected, joined_at)
       VALUES (?, ?, ?, 0, 0, 1, ?)`
    ).run(id, data.sessionId, data.nickname, now);

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

  updateScore(id: string, score: number, streak: number): void {
    const db = getDb();
    db.prepare(
      'UPDATE players SET score = ?, streak = ? WHERE id = ?'
    ).run(score, streak, id);
  }

  setConnected(id: string, connected: boolean): void {
    const db = getDb();
    db.prepare(
      'UPDATE players SET is_connected = ? WHERE id = ?'
    ).run(connected ? 1 : 0, id);
  }

  deleteBySessionId(sessionId: string): number {
    const db = getDb();
    const result = db.prepare('DELETE FROM players WHERE session_id = ?').run(sessionId);
    return result.changes;
  }

  existsNicknameInSession(sessionId: string, nickname: string): boolean {
    const db = getDb();
    const row = db.prepare(
      'SELECT 1 FROM players WHERE session_id = ? AND LOWER(nickname) = LOWER(?)'
    ).get(sessionId, nickname);
    return !!row;
  }
}
