import { v4 as uuidv4 } from 'uuid';
import { sql } from 'kysely';
import { getKysely } from '../connection';
import { Quiz, QuizSummary, Question, Answer, CreateQuestionInput, QuestionType } from '@shared/types';

interface QuizRow {
  id: string;
  title: string;
  description: string;
  host_id: string;
  is_published: number;
  created_at: string;
  updated_at: string;
}

interface QuestionRow {
  id: string;
  quiz_id: string;
  text: string;
  description: string | null;
  image_url: string | null;
  question_type: string;
  require_all: number;
  time_limit: number;
  points: number;
  order_index: number;
  created_at: string;
}

interface AnswerRow {
  id: string;
  question_id: string;
  text: string;
  is_correct: number;
  order_index: number;
}

interface QuizSummaryRow extends QuizRow {
  question_count: string | number;
  game_count: string | number;
  host_username?: string;
}

interface CreateQuizData {
  title: string;
  description?: string;
  hostId: string;
}

interface UpdateQuizData {
  title?: string;
  description?: string;
  isPublished?: boolean;
}

function rowToAnswer(row: AnswerRow): Answer {
  return {
    id: row.id,
    questionId: row.question_id,
    text: row.text,
    isCorrect: row.is_correct === 1,
    orderIndex: row.order_index,
  };
}

function rowToQuestion(row: QuestionRow, answers: Answer[]): Question {
  return {
    id: row.id,
    quizId: row.quiz_id,
    text: row.text,
    description: row.description ?? undefined,
    imageUrl: row.image_url ?? undefined,
    questionType: (row.question_type || 'multiple-choice') as QuestionType,
    requireAll: row.require_all === 1,
    timeLimit: row.time_limit,
    points: row.points,
    orderIndex: row.order_index,
    answers,
  };
}

function rowToQuiz(row: QuizRow, questions: Question[]): Quiz {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    hostId: row.host_id,
    isPublished: row.is_published === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    questions,
  };
}

function rowToQuizSummary(row: QuizSummaryRow): QuizSummary {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isPublished: row.is_published === 1,
    questionCount: Number(row.question_count),
    gameCount: Number(row.game_count || 0),
    hostUsername: row.host_username,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class QuizRepository {
  async findById(id: string): Promise<Quiz | undefined> {
    const db = getKysely();

    const quizRow = await db
      .selectFrom('quizzes')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!quizRow) {
      return undefined;
    }

    const questionRows = await db
      .selectFrom('questions')
      .selectAll()
      .where('quiz_id', '=', id)
      .orderBy('order_index', 'asc')
      .execute();

    const questions: Question[] = [];
    for (const qRow of questionRows) {
      const answerRows = await db
        .selectFrom('answers')
        .selectAll()
        .where('question_id', '=', qRow.id)
        .orderBy('order_index', 'asc')
        .execute();

      const answers = answerRows.map((a) => rowToAnswer(a as AnswerRow));
      questions.push(rowToQuestion(qRow as QuestionRow, answers));
    }

    return rowToQuiz(quizRow as QuizRow, questions);
  }

  async findAllByHostId(hostId: string): Promise<QuizSummary[]> {
    const db = getKysely();

    const rows = await db
      .selectFrom('quizzes as q')
      .leftJoin('questions as qu', 'qu.quiz_id', 'q.id')
      .leftJoin('game_sessions as gs', 'gs.quiz_id', 'q.id')
      .where('q.host_id', '=', hostId)
      .groupBy('q.id')
      .select([
        'q.id',
        'q.title',
        'q.description',
        'q.host_id',
        'q.is_published',
        'q.created_at',
        'q.updated_at',
        sql<number>`COUNT(DISTINCT qu.id)`.as('question_count'),
        sql<number>`COUNT(DISTINCT gs.id)`.as('game_count'),
      ])
      .orderBy('q.created_at', 'desc')
      .execute();

    return rows.map((row) => rowToQuizSummary(row as unknown as QuizSummaryRow));
  }

  async create(data: CreateQuizData): Promise<Quiz> {
    const db = getKysely();
    const id = uuidv4();
    const now = new Date().toISOString();

    await db
      .insertInto('quizzes')
      .values({
        id,
        title: data.title,
        description: data.description || '',
        host_id: data.hostId,
        is_published: 0,
        created_at: now,
        updated_at: now,
      })
      .execute();

    return {
      id,
      title: data.title,
      description: data.description || '',
      hostId: data.hostId,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
      questions: [],
    };
  }

  async update(id: string, data: UpdateQuizData): Promise<Quiz | undefined> {
    const db = getKysely();
    const now = new Date().toISOString();

    const updates: Record<string, string | number> = { updated_at: now };

    if (data.title !== undefined) {
      updates.title = data.title;
    }
    if (data.description !== undefined) {
      updates.description = data.description;
    }
    if (data.isPublished !== undefined) {
      updates.is_published = data.isPublished ? 1 : 0;
    }

    if (Object.keys(updates).length === 1) {
      // Only updated_at, no real changes
      return this.findById(id);
    }

    await db
      .updateTable('quizzes')
      .set(updates)
      .where('id', '=', id)
      .execute();

    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const db = getKysely();

    return await db.transaction().execute(async (trx) => {
      // Delete dependent rows that lack ON DELETE CASCADE
      const sessionIds = await trx
        .selectFrom('game_sessions')
        .select('id')
        .where('quiz_id', '=', id)
        .execute();

      for (const s of sessionIds) {
        await trx.deleteFrom('player_answers').where('session_id', '=', s.id).execute();
        await trx.deleteFrom('players').where('session_id', '=', s.id).execute();
      }
      await trx.deleteFrom('game_sessions').where('quiz_id', '=', id).execute();

      const result = await trx.deleteFrom('quizzes').where('id', '=', id).executeTakeFirst();
      return Number(result.numDeletedRows) > 0;
    });
  }

  async replaceQuestions(quizId: string, questions: CreateQuestionInput[]): Promise<Question[]> {
    const db = getKysely();

    return await db.transaction().execute(async (trx) => {
      // Delete player_answers referencing these questions, then questions themselves
      const questionIds = await trx
        .selectFrom('questions')
        .select('id')
        .where('quiz_id', '=', quizId)
        .execute();

      if (questionIds.length > 0) {
        await trx
          .deleteFrom('player_answers')
          .where(
            'question_id',
            'in',
            questionIds.map((q) => q.id)
          )
          .execute();
      }

      await trx.deleteFrom('questions').where('quiz_id', '=', quizId).execute();

      const now = new Date().toISOString();
      const result: Question[] = [];

      for (const q of questions) {
        const questionId = q.id || uuidv4();

        await trx
          .insertInto('questions')
          .values({
            id: questionId,
            quiz_id: quizId,
            text: q.text,
            description: q.description || null,
            image_url: q.imageUrl || null,
            question_type: q.questionType || 'multiple-choice',
            require_all: q.requireAll ? 1 : 0,
            time_limit: q.timeLimit,
            points: q.points,
            order_index: q.orderIndex,
            created_at: now,
          })
          .execute();

        const answers: Answer[] = [];
        for (const a of q.answers) {
          const answerId = a.id || uuidv4();

          await trx
            .insertInto('answers')
            .values({
              id: answerId,
              question_id: questionId,
              text: a.text,
              is_correct: a.isCorrect ? 1 : 0,
              order_index: a.orderIndex,
            })
            .execute();

          answers.push({
            id: answerId,
            questionId,
            text: a.text,
            isCorrect: a.isCorrect,
            orderIndex: a.orderIndex,
          });
        }

        result.push({
          id: questionId,
          quizId,
          text: q.text,
          description: q.description,
          imageUrl: q.imageUrl,
          questionType: q.questionType || 'multiple-choice',
          requireAll: q.requireAll || false,
          timeLimit: q.timeLimit,
          points: q.points,
          orderIndex: q.orderIndex,
          answers,
        });
      }

      // Update the quiz's updated_at timestamp
      await trx
        .updateTable('quizzes')
        .set({ updated_at: now })
        .where('id', '=', quizId)
        .execute();

      return result;
    });
  }

  async countByHostId(hostId: string): Promise<number> {
    const db = getKysely();
    const row = await db
      .selectFrom('quizzes')
      .select(sql<number>`COUNT(*)`.as('count'))
      .where('host_id', '=', hostId)
      .executeTakeFirstOrThrow();
    return Number(row.count);
  }

  async hasGames(quizId: string): Promise<boolean> {
    const db = getKysely();
    const row = await db
      .selectFrom('game_sessions')
      .select(sql<number>`COUNT(*)`.as('count'))
      .where('quiz_id', '=', quizId)
      .executeTakeFirstOrThrow();
    return Number(row.count) > 0;
  }

  async findAllPublic(excludeHostId?: string): Promise<QuizSummary[]> {
    const db = getKysely();

    let query = db
      .selectFrom('quizzes as q')
      .leftJoin('questions as qu', 'qu.quiz_id', 'q.id')
      .leftJoin('game_sessions as gs', 'gs.quiz_id', 'q.id')
      .innerJoin('users as u', 'u.id', 'q.host_id')
      .where('q.is_published', '=', 1)
      .groupBy(['q.id', 'u.username'])
      .select([
        'q.id',
        'q.title',
        'q.description',
        'q.host_id',
        'q.is_published',
        'q.created_at',
        'q.updated_at',
        sql<number>`COUNT(DISTINCT qu.id)`.as('question_count'),
        sql<number>`COUNT(DISTINCT gs.id)`.as('game_count'),
        'u.username as host_username',
      ])
      .orderBy('q.created_at', 'desc');

    if (excludeHostId) {
      query = query.where('q.host_id', '!=', excludeHostId);
    }

    const rows = await query.execute();
    return rows.map((row) => rowToQuizSummary(row as unknown as QuizSummaryRow));
  }
}
