import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../connection';
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
  count: number;
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
  create(data: CreatePlayerAnswerData): PlayerAnswer {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO player_answers (id, player_id, session_id, question_id, answer_id, is_correct, time_taken, score, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.playerId,
      data.sessionId,
      data.questionId,
      data.answerId,
      data.isCorrect ? 1 : 0,
      data.timeTaken,
      data.score,
      now
    );

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

  findByPlayerAndQuestion(playerId: string, questionId: string): PlayerAnswer | undefined {
    const db = getDb();
    const row = db.prepare(
      'SELECT * FROM player_answers WHERE player_id = ? AND question_id = ?'
    ).get(playerId, questionId) as PlayerAnswerRow | undefined;
    return row ? rowToPlayerAnswer(row) : undefined;
  }

  findBySessionAndQuestion(sessionId: string, questionId: string): PlayerAnswer[] {
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM player_answers WHERE session_id = ? AND question_id = ?'
    ).all(sessionId, questionId) as PlayerAnswerRow[];
    return rows.map(rowToPlayerAnswer);
  }

  getAnswerDistribution(sessionId: string, questionId: string): AnswerDistribution[] {
    const db = getDb();

    const rows = db.prepare(
      `SELECT
        a.id AS answer_id,
        a.text AS answer_text,
        COUNT(pa.id) AS count,
        a.is_correct,
        a.order_index
       FROM answers a
       LEFT JOIN player_answers pa
         ON pa.answer_id = a.id
         AND pa.session_id = ?
         AND pa.question_id = ?
       WHERE a.question_id = ?
       GROUP BY a.id
       ORDER BY a.order_index ASC`
    ).all(sessionId, questionId, questionId) as AnswerDistributionRow[];

    return rows.map((row) => ({
      answerId: row.answer_id,
      answerText: row.answer_text,
      count: row.count,
      isCorrect: row.is_correct === 1,
      orderIndex: row.order_index,
    }));
  }
}
