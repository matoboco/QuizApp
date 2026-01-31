import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../connection';
import { GameSession, GameStatus } from '@shared/types';

interface GameSessionRow {
  id: string;
  quiz_id: string;
  host_id: string;
  pin: string;
  status: string;
  current_question_index: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

interface CreateGameData {
  quizId: string;
  hostId: string;
  pin: string;
}

interface UpdateStatusExtra {
  currentQuestionIndex?: number;
  startedAt?: string;
  finishedAt?: string;
}

function rowToGameSession(row: GameSessionRow): GameSession {
  return {
    id: row.id,
    quizId: row.quiz_id,
    hostId: row.host_id,
    pin: row.pin,
    status: row.status as GameStatus,
    currentQuestionIndex: row.current_question_index,
    createdAt: row.created_at,
    startedAt: row.started_at ?? undefined,
    finishedAt: row.finished_at ?? undefined,
  };
}

export class GameRepository {
  findById(id: string): GameSession | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM game_sessions WHERE id = ?').get(id) as GameSessionRow | undefined;
    return row ? rowToGameSession(row) : undefined;
  }

  findByPin(pin: string): GameSession | undefined {
    const db = getDb();
    const row = db.prepare('SELECT * FROM game_sessions WHERE pin = ?').get(pin) as GameSessionRow | undefined;
    return row ? rowToGameSession(row) : undefined;
  }

  create(data: CreateGameData): GameSession {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO game_sessions (id, quiz_id, host_id, pin, status, current_question_index, created_at)
       VALUES (?, ?, ?, ?, 'lobby', 0, ?)`
    ).run(id, data.quizId, data.hostId, data.pin, now);

    return {
      id,
      quizId: data.quizId,
      hostId: data.hostId,
      pin: data.pin,
      status: 'lobby',
      currentQuestionIndex: 0,
      createdAt: now,
      startedAt: undefined,
      finishedAt: undefined,
    };
  }

  updateStatus(id: string, status: GameStatus, extra?: UpdateStatusExtra): GameSession | undefined {
    const db = getDb();

    const fields: string[] = ['status = ?'];
    const values: (string | number)[] = [status];

    if (extra?.currentQuestionIndex !== undefined) {
      fields.push('current_question_index = ?');
      values.push(extra.currentQuestionIndex);
    }
    if (extra?.startedAt !== undefined) {
      fields.push('started_at = ?');
      values.push(extra.startedAt);
    }
    if (extra?.finishedAt !== undefined) {
      fields.push('finished_at = ?');
      values.push(extra.finishedAt);
    }

    values.push(id);

    db.prepare(
      `UPDATE game_sessions SET ${fields.join(', ')} WHERE id = ?`
    ).run(...values);

    return this.findById(id);
  }

  findActiveByHostId(hostId: string): GameSession | undefined {
    const db = getDb();
    const row = db.prepare(
      `SELECT * FROM game_sessions
       WHERE host_id = ? AND status != 'finished'
       ORDER BY created_at DESC
       LIMIT 1`
    ).get(hostId) as GameSessionRow | undefined;
    return row ? rowToGameSession(row) : undefined;
  }
}
