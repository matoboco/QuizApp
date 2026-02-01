import { Quiz, QuizSummary } from '@shared/types';
import { quizRepository } from '../db/repositories';
import { NotFoundError, ForbiddenError } from '../middleware/error.middleware';
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
}

export const quizService = new QuizService();
