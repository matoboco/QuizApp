import crypto from 'crypto';
import { sql } from 'kysely';
import { getKysely } from '../db/connection';
import { gameRepository } from '../db/repositories';
import {
  GameHistorySummary,
  GameHistoryDetail,
  PlayerResult,
  QuestionStats,
  RankingSnapshot,
  GameQuestion,
} from '@shared/types';
import { NotFoundError, ForbiddenError } from '../middleware/error.middleware';

class HistoryService {
  async getGamesByQuizId(quizId: string, hostId: string): Promise<GameHistorySummary[]> {
    const db = getKysely();

    // Verify the quiz belongs to this host
    const quiz = await db
      .selectFrom('quizzes')
      .select(['id', 'host_id'])
      .where('id', '=', quizId)
      .executeTakeFirst();

    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (quiz.host_id !== hostId) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    // Get all finished games for this quiz
    const games = await db
      .selectFrom('game_sessions')
      .leftJoin('players', 'players.session_id', 'game_sessions.id')
      .select([
        'game_sessions.id',
        'game_sessions.pin',
        'game_sessions.started_at',
        'game_sessions.finished_at',
        sql<number>`count(players.id)`.as('player_count'),
      ])
      .where('game_sessions.quiz_id', '=', quizId)
      .where('game_sessions.status', '=', 'finished')
      .groupBy('game_sessions.id')
      .orderBy('game_sessions.finished_at', 'desc')
      .execute();

    return games.map((game) => ({
      id: game.id as string,
      pin: game.pin as string,
      playerCount: Number(game.player_count ?? 0),
      startedAt: game.started_at as string,
      finishedAt: game.finished_at as string,
    }));
  }

  async getGameDetails(
    gameId: string,
    requesterId: string | null,
    shareToken?: string
  ): Promise<GameHistoryDetail> {
    const db = getKysely();

    // Get game with quiz info
    const game = await db
      .selectFrom('game_sessions')
      .innerJoin('quizzes', 'quizzes.id', 'game_sessions.quiz_id')
      .select([
        'game_sessions.id',
        'game_sessions.pin',
        'game_sessions.started_at',
        'game_sessions.finished_at',
        'game_sessions.host_id',
        'game_sessions.share_token',
        'game_sessions.quiz_id',
        'quizzes.title as quiz_title',
      ])
      .where('game_sessions.id', '=', gameId)
      .executeTakeFirst();

    if (!game) {
      throw new NotFoundError('Game not found');
    }

    // Check access: must be host, or have valid share token
    const isHost = requesterId && game.host_id === requesterId;
    const hasValidToken = shareToken && game.share_token === shareToken;

    if (!isHost && !hasValidToken) {
      throw new ForbiddenError('You do not have access to this game history');
    }

    // Get players with their final scores
    const players = await db
      .selectFrom('players')
      .select(['id', 'nickname', 'score'])
      .where('session_id', '=', gameId)
      .orderBy('score', 'desc')
      .execute();

    // Get questions
    const questions = await db
      .selectFrom('questions')
      .select(['id', 'text', 'order_index'])
      .where('quiz_id', '=', game.quiz_id as string)
      .orderBy('order_index', 'asc')
      .execute();

    const totalQuestions = questions.length;

    // Get player stats (correct answers, average time)
    const playerStats = await db
      .selectFrom('player_answers')
      .select([
        'player_id',
        sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`.as('correct_count'),
        sql<number>`count(*)`.as('total_count'),
        sql<number>`avg(time_taken)`.as('avg_time'),
      ])
      .where('session_id', '=', gameId)
      .groupBy('player_id')
      .execute();

    const statsMap = new Map(
      playerStats.map((s) => [
        s.player_id,
        {
          correctCount: Number(s.correct_count ?? 0),
          totalCount: Number(s.total_count ?? 0),
          avgTime: Number(s.avg_time ?? 0),
        },
      ])
    );

    const playerResults: PlayerResult[] = players.map((player, index) => {
      const stats = statsMap.get(player.id) || { correctCount: 0, totalCount: 0, avgTime: 0 };
      return {
        id: player.id,
        nickname: player.nickname,
        finalScore: player.score,
        finalRank: index + 1,
        correctAnswers: stats.correctCount,
        totalAnswers: totalQuestions,
        averageTime: Math.round(stats.avgTime),
      };
    });

    const gameQuestions: GameQuestion[] = questions.map((q) => ({
      id: q.id,
      text: q.text,
      questionIndex: q.order_index,
    }));

    return {
      id: game.id as string,
      quiz: {
        id: game.quiz_id as string,
        title: game.quiz_title as string,
      },
      pin: game.pin as string,
      startedAt: game.started_at as string,
      finishedAt: game.finished_at as string,
      players: playerResults,
      questions: gameQuestions,
      shareToken: (game.share_token as string) || null,
    };
  }

  async getQuestionStats(
    gameId: string,
    questionIndex: number,
    requesterId: string | null,
    shareToken?: string
  ): Promise<QuestionStats> {
    const db = getKysely();

    // Get game for access check
    const game = await db
      .selectFrom('game_sessions')
      .select(['id', 'host_id', 'share_token', 'quiz_id'])
      .where('id', '=', gameId)
      .executeTakeFirst();

    if (!game) {
      throw new NotFoundError('Game not found');
    }

    const isHost = requesterId && game.host_id === requesterId;
    const hasValidToken = shareToken && game.share_token === shareToken;

    if (!isHost && !hasValidToken) {
      throw new ForbiddenError('You do not have access to this game history');
    }

    // Get the question
    const question = await db
      .selectFrom('questions')
      .select(['id', 'text'])
      .where('quiz_id', '=', game.quiz_id as string)
      .where('order_index', '=', questionIndex)
      .executeTakeFirst();

    if (!question) {
      throw new NotFoundError('Question not found');
    }

    // Get answer distribution
    const answers = await db
      .selectFrom('answers')
      .leftJoin('player_answers', (join) =>
        join
          .onRef('player_answers.answer_id', '=', 'answers.id')
          .on('player_answers.session_id', '=', gameId)
      )
      .select([
        'answers.id',
        'answers.text',
        'answers.is_correct',
        sql<number>`count(player_answers.id)`.as('count'),
      ])
      .where('answers.question_id', '=', question.id)
      .groupBy('answers.id')
      .orderBy('answers.order_index', 'asc')
      .execute();

    // Get overall stats
    const stats = await db
      .selectFrom('player_answers')
      .select([
        sql<number>`sum(case when is_correct = 1 then 1 else 0 end)`.as('correct_count'),
        sql<number>`count(*)`.as('total_count'),
        sql<number>`avg(time_taken)`.as('avg_time'),
      ])
      .where('session_id', '=', gameId)
      .where('question_id', '=', question.id)
      .executeTakeFirst();

    return {
      questionId: question.id,
      questionIndex,
      questionText: question.text,
      correctCount: Number(stats?.correct_count ?? 0),
      totalAnswers: Number(stats?.total_count ?? 0),
      averageTime: Math.round(Number(stats?.avg_time ?? 0)),
      answerDistribution: answers.map((a) => ({
        answerId: a.id,
        text: a.text,
        count: Number(a.count ?? 0),
        isCorrect: a.is_correct === 1,
      })),
    };
  }

  async getRankingProgression(
    gameId: string,
    requesterId: string | null,
    shareToken?: string
  ): Promise<RankingSnapshot[]> {
    const db = getKysely();

    // Get game for access check
    const game = await db
      .selectFrom('game_sessions')
      .select(['id', 'host_id', 'share_token', 'quiz_id'])
      .where('id', '=', gameId)
      .executeTakeFirst();

    if (!game) {
      throw new NotFoundError('Game not found');
    }

    const isHost = requesterId && game.host_id === requesterId;
    const hasValidToken = shareToken && game.share_token === shareToken;

    if (!isHost && !hasValidToken) {
      throw new ForbiddenError('You do not have access to this game history');
    }

    // Get all questions for this quiz
    const questions = await db
      .selectFrom('questions')
      .select(['id', 'order_index'])
      .where('quiz_id', '=', game.quiz_id as string)
      .orderBy('order_index', 'asc')
      .execute();

    // Get all players
    const players = await db
      .selectFrom('players')
      .select(['id', 'nickname'])
      .where('session_id', '=', gameId)
      .execute();

    // Get all player answers
    const allAnswers = await db
      .selectFrom('player_answers')
      .select(['player_id', 'question_id', 'score'])
      .where('session_id', '=', gameId)
      .execute();

    // Build a map of question_id -> order_index
    const questionOrderMap = new Map(questions.map((q) => [q.id, q.order_index]));

    // Calculate cumulative scores after each question
    const snapshots: RankingSnapshot[] = [];

    for (let i = 0; i < questions.length; i++) {
      const questionsUpToNow = questions.slice(0, i + 1).map((q) => q.id);

      // Calculate scores for each player up to this question
      const playerScores = players.map((player) => {
        const relevantAnswers = allAnswers.filter(
          (a) => a.player_id === player.id && questionsUpToNow.includes(a.question_id)
        );
        const totalScore = relevantAnswers.reduce((sum, a) => sum + a.score, 0);
        return {
          playerId: player.id,
          nickname: player.nickname,
          score: totalScore,
          rank: 0,
        };
      });

      // Sort by score descending and assign ranks
      playerScores.sort((a, b) => b.score - a.score);
      playerScores.forEach((p, idx) => {
        p.rank = idx + 1;
      });

      snapshots.push({
        afterQuestionIndex: i,
        rankings: playerScores,
      });
    }

    return snapshots;
  }

  async generateShareToken(gameId: string, hostId: string): Promise<string> {
    const db = getKysely();

    // Get game and verify ownership
    const game = await gameRepository.findById(gameId);
    if (!game) {
      throw new NotFoundError('Game not found');
    }

    if (game.hostId !== hostId) {
      throw new ForbiddenError('You do not have access to this game');
    }

    // Generate a new share token
    const shareToken = crypto.randomBytes(16).toString('hex');

    await db
      .updateTable('game_sessions')
      .set({ share_token: shareToken })
      .where('id', '=', gameId)
      .execute();

    return shareToken;
  }

  async getGameByShareToken(shareToken: string): Promise<GameHistoryDetail> {
    const db = getKysely();

    const game = await db
      .selectFrom('game_sessions')
      .select(['id'])
      .where('share_token', '=', shareToken)
      .executeTakeFirst();

    if (!game) {
      throw new NotFoundError('Game not found or share link is invalid');
    }

    return this.getGameDetails(game.id as string, null, shareToken);
  }
}

export const historyService = new HistoryService();
