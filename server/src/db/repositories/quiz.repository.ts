import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../connection';
import { Quiz, QuizSummary, Question, Answer, CreateQuestionInput } from '@shared/types';

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
  image_url: string | null;
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
  question_count: number;
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
    imageUrl: row.image_url ?? undefined,
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
    questionCount: row.question_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class QuizRepository {
  findById(id: string): Quiz | undefined {
    const db = getDb();

    const quizRow = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id) as QuizRow | undefined;
    if (!quizRow) {
      return undefined;
    }

    const questionRows = db.prepare(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY order_index ASC'
    ).all(id) as QuestionRow[];

    const questions: Question[] = questionRows.map((qRow) => {
      const answerRows = db.prepare(
        'SELECT * FROM answers WHERE question_id = ? ORDER BY order_index ASC'
      ).all(qRow.id) as AnswerRow[];

      const answers = answerRows.map(rowToAnswer);
      return rowToQuestion(qRow, answers);
    });

    return rowToQuiz(quizRow, questions);
  }

  findAllByHostId(hostId: string): QuizSummary[] {
    const db = getDb();

    const rows = db.prepare(
      `SELECT q.*, COUNT(qu.id) AS question_count
       FROM quizzes q
       LEFT JOIN questions qu ON qu.quiz_id = q.id
       WHERE q.host_id = ?
       GROUP BY q.id
       ORDER BY q.created_at DESC`
    ).all(hostId) as QuizSummaryRow[];

    return rows.map(rowToQuizSummary);
  }

  create(data: CreateQuizData): Quiz {
    const db = getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO quizzes (id, title, description, host_id, is_published, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, ?, ?)`
    ).run(id, data.title, data.description || '', data.hostId, now, now);

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

  update(id: string, data: UpdateQuizData): Quiz | undefined {
    const db = getDb();
    const now = new Date().toISOString();

    const fields: string[] = [];
    const values: (string | number)[] = [];

    if (data.title !== undefined) {
      fields.push('title = ?');
      values.push(data.title);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      values.push(data.description);
    }
    if (data.isPublished !== undefined) {
      fields.push('is_published = ?');
      values.push(data.isPublished ? 1 : 0);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    db.prepare(
      `UPDATE quizzes SET ${fields.join(', ')} WHERE id = ?`
    ).run(...values);

    return this.findById(id);
  }

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
    return result.changes > 0;
  }

  replaceQuestions(quizId: string, questions: CreateQuestionInput[]): Question[] {
    const db = getDb();

    const replaceTransaction = db.transaction(() => {
      // Delete all existing questions (answers cascade-delete automatically)
      db.prepare('DELETE FROM questions WHERE quiz_id = ?').run(quizId);

      const insertQuestion = db.prepare(
        `INSERT INTO questions (id, quiz_id, text, image_url, time_limit, points, order_index, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      );

      const insertAnswer = db.prepare(
        `INSERT INTO answers (id, question_id, text, is_correct, order_index)
         VALUES (?, ?, ?, ?, ?)`
      );

      const now = new Date().toISOString();
      const result: Question[] = [];

      for (const q of questions) {
        const questionId = q.id || uuidv4();

        insertQuestion.run(
          questionId,
          quizId,
          q.text,
          q.imageUrl || null,
          q.timeLimit,
          q.points,
          q.orderIndex,
          now
        );

        const answers: Answer[] = [];
        for (const a of q.answers) {
          const answerId = a.id || uuidv4();

          insertAnswer.run(
            answerId,
            questionId,
            a.text,
            a.isCorrect ? 1 : 0,
            a.orderIndex
          );

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
          imageUrl: q.imageUrl,
          timeLimit: q.timeLimit,
          points: q.points,
          orderIndex: q.orderIndex,
          answers,
        });
      }

      // Update the quiz's updated_at timestamp
      db.prepare('UPDATE quizzes SET updated_at = ? WHERE id = ?').run(now, quizId);

      return result;
    });

    return replaceTransaction();
  }

  countByHostId(hostId: string): number {
    const db = getDb();
    const row = db.prepare(
      'SELECT COUNT(*) AS count FROM quizzes WHERE host_id = ?'
    ).get(hostId) as { count: number };
    return row.count;
  }
}
