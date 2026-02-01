import { v4 as uuidv4 } from 'uuid';
import { getKysely } from '../connection';
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
  async findById(id: string): Promise<GameSession | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('game_sessions')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? rowToGameSession(row as GameSessionRow) : undefined;
  }

  async findByPin(pin: string): Promise<GameSession | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('game_sessions')
      .selectAll()
      .where('pin', '=', pin)
      .executeTakeFirst();
    return row ? rowToGameSession(row as GameSessionRow) : undefined;
  }

  async create(data: CreateGameData): Promise<GameSession> {
    const db = getKysely();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db
      .insertInto('game_sessions')
      .values({
        id,
        quiz_id: data.quizId,
        host_id: data.hostId,
        pin: data.pin,
        status: 'lobby',
        current_question_index: 0,
        created_at: now,
      })
      .execute();

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

  async updateStatus(id: string, status: GameStatus, extra?: UpdateStatusExtra): Promise<GameSession | undefined> {
    const db = getKysely();

    const updates: Record<string, string | number> = { status };

    if (extra?.currentQuestionIndex !== undefined) {
      updates.current_question_index = extra.currentQuestionIndex;
    }
    if (extra?.startedAt !== undefined) {
      updates.started_at = extra.startedAt;
    }
    if (extra?.finishedAt !== undefined) {
      updates.finished_at = extra.finishedAt;
    }

    await db
      .updateTable('game_sessions')
      .set(updates)
      .where('id', '=', id)
      .execute();

    return this.findById(id);
  }

  async findActiveByHostId(hostId: string): Promise<GameSession | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('game_sessions')
      .selectAll()
      .where('host_id', '=', hostId)
      .where('status', '!=', 'finished')
      .orderBy('created_at', 'desc')
      .limit(1)
      .executeTakeFirst();
    return row ? rowToGameSession(row as GameSessionRow) : undefined;
  }
}
