import { Quiz, QuizSummary } from '@shared/types';
import { quizRepository } from '../db/repositories';
import { NotFoundError, ForbiddenError, BadRequestError } from '../middleware/error.middleware';
import { CreateQuizInput, UpdateQuizInput } from './quiz.validation';

class QuizService {
  async createQuiz(hostId: string, data: CreateQuizInput): Promise<Quiz> {
    return quizRepository.create({
      title: data.title,
      description: data.description,
      hostId,
    });
  }

  async getQuiz(quizId: string, hostId: string): Promise<Quiz> {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (quiz.hostId !== hostId) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    return quiz;
  }

  async getQuizzesByHost(hostId: string): Promise<QuizSummary[]> {
    return quizRepository.findAllByHostId(hostId);
  }

  async updateQuiz(quizId: string, hostId: string, data: UpdateQuizInput): Promise<Quiz> {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (quiz.hostId !== hostId) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    // Check if quiz has been played — if so, block editing
    const hasGames = await quizRepository.hasGames(quizId);
    if (hasGames) {
      throw new BadRequestError('This quiz has been played and cannot be edited. Duplicate it to make changes.');
    }

    // If questions are provided, replace them all in a transaction
    if (data.questions) {
      await quizRepository.replaceQuestions(quizId, data.questions);
    }

    // Update quiz metadata fields (title, description, isPublished)
    const { questions: _questions, ...quizFields } = data;
    const updated = await quizRepository.update(quizId, quizFields);
    if (!updated) {
      throw new NotFoundError('Quiz not found');
    }

    return updated;
  }

  async deleteQuiz(quizId: string, hostId: string): Promise<void> {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (quiz.hostId !== hostId) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    await quizRepository.delete(quizId);
  }

  async getQuizForGame(quizId: string): Promise<Quiz> {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    return quiz;
  }

  async getPublicQuizzes(currentHostId: string): Promise<QuizSummary[]> {
    return quizRepository.findAllPublic(currentHostId);
  }

  async getPublicQuiz(quizId: string): Promise<Quiz> {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (!quiz.isPublished) {
      throw new NotFoundError('Quiz not found');
    }

    return quiz;
  }

  async duplicateQuiz(quizId: string, hostId: string): Promise<Quiz> {
    const quiz = await quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    // Allow duplicating own quizzes or public quizzes from other users
    if (quiz.hostId !== hostId && !quiz.isPublished) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    // Create a new quiz as a copy
    const newQuiz = await quizRepository.create({
      title: `${quiz.title} (Copy)`,
      description: quiz.description,
      hostId,
    });

    // Copy questions and answers if any exist
    if (quiz.questions.length > 0) {
      const questionsInput = quiz.questions.map((q) => ({
        text: q.text,
        description: q.description,
        imageUrl: q.imageUrl,
        questionType: q.questionType,
        requireAll: q.requireAll,
        timeLimit: q.timeLimit,
        points: q.points,
        orderIndex: q.orderIndex,
        correctNumber: q.correctNumber,
        tolerance: q.tolerance,
        answers: q.answers.map((a) => ({
          text: a.text,
          isCorrect: a.isCorrect,
          orderIndex: a.orderIndex,
        })),
      }));
      await quizRepository.replaceQuestions(newQuiz.id, questionsInput);
    }

    // Return the full new quiz
    const result = await quizRepository.findById(newQuiz.id);
    return result!;
  }
}

export const quizService = new QuizService();
