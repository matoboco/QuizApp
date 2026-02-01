import { v4 as uuidv4 } from 'uuid';
import { sql } from 'kysely';
import { getKysely } from '../connection';
import { PlayerAnswer, AnswerDistribution } from '@shared/types';

interface PlayerAnswerRow {
  id: string;
  player_id: string;
  session_id: string;
  question_id: string;
  answer_id: string | null;
  is_correct: number;
  time_taken: number;
  score: number;
  created_at: string;
}

interface CreatePlayerAnswerData {
  playerId: string;
  sessionId: string;
  questionId: string;
  answerId: string | null;
  isCorrect: boolean;
  timeTaken: number;
  score: number;
}

interface AnswerDistributionRow {
  answer_id: string;
  answer_text: string;
  count: string | number;
  is_correct: number;
  order_index: number;
}

function rowToPlayerAnswer(row: PlayerAnswerRow): PlayerAnswer {
  return {
    id: row.id,
    playerId: row.player_id,
    sessionId: row.session_id,
    questionId: row.question_id,
    answerId: row.answer_id,
    isCorrect: row.is_correct === 1,
    timeTaken: row.time_taken,
    score: row.score,
    createdAt: row.created_at,
  };
}

export class PlayerAnswerRepository {
  async create(data: CreatePlayerAnswerData): Promise<PlayerAnswer> {
    const db = getKysely();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db
      .insertInto('player_answers')
      .values({
        id,
        player_id: data.playerId,
        session_id: data.sessionId,
        question_id: data.questionId,
        answer_id: data.answerId,
        is_correct: data.isCorrect ? 1 : 0,
        time_taken: data.timeTaken,
        score: data.score,
        created_at: now,
      })
      .execute();

    return {
      id,
      playerId: data.playerId,
      sessionId: data.sessionId,
      questionId: data.questionId,
      answerId: data.answerId,
      isCorrect: data.isCorrect,
      timeTaken: data.timeTaken,
      score: data.score,
      createdAt: now,
    };
  }

  async findByPlayerAndQuestion(playerId: string, questionId: string): Promise<PlayerAnswer | undefined> {
    const db = getKysely();
    const row = await db
      .selectFrom('player_answers')
      .selectAll()
      .where('player_id', '=', playerId)
      .where('question_id', '=', questionId)
      .executeTakeFirst();
    return row ? rowToPlayerAnswer(row as PlayerAnswerRow) : undefined;
  }

  async findBySessionAndQuestion(sessionId: string, questionId: string): Promise<PlayerAnswer[]> {
    const db = getKysely();
    const rows = await db
      .selectFrom('player_answers')
      .selectAll()
      .where('session_id', '=', sessionId)
      .where('question_id', '=', questionId)
      .execute();
    return rows.map((row) => rowToPlayerAnswer(row as PlayerAnswerRow));
  }

  async getAnswerDistribution(sessionId: string, questionId: string): Promise<AnswerDistribution[]> {
    const db = getKysely();

    const rows = await db
      .selectFrom('answers as a')
      .leftJoin('player_answers as pa', (join) =>
        join
          .onRef('pa.answer_id', '=', 'a.id')
          .on('pa.session_id', '=', sessionId)
          .on('pa.question_id', '=', questionId)
      )
      .where('a.question_id', '=', questionId)
      .groupBy('a.id')
      .select([
        'a.id as answer_id',
        'a.text as answer_text',
        sql<number>`COUNT(pa.id)`.as('count'),
        'a.is_correct',
        'a.order_index',
      ])
      .orderBy('a.order_index', 'asc')
      .execute();

    return rows.map((row) => ({
      answerId: row.answer_id,
      answerText: row.answer_text,
      count: Number(row.count),
      isCorrect: row.is_correct === 1,
      orderIndex: row.order_index,
    }));
  }
}
