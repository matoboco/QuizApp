import { Quiz, QuizSummary } from '@shared/types';
import { quizRepository } from '../db/repositories';
import { NotFoundError, ForbiddenError } from '../middleware/error.middleware';
import { CreateQuizInput, UpdateQuizInput } from './quiz.validation';

class QuizService {
  createQuiz(hostId: string, data: CreateQuizInput): Quiz {
    return quizRepository.create({
      title: data.title,
      description: data.description,
      hostId,
    });
  }

  getQuiz(quizId: string, hostId: string): Quiz {
    const quiz = quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (quiz.hostId !== hostId) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    return quiz;
  }

  getQuizzesByHost(hostId: string): QuizSummary[] {
    return quizRepository.findAllByHostId(hostId);
  }

  updateQuiz(quizId: string, hostId: string, data: UpdateQuizInput): Quiz {
    const quiz = quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (quiz.hostId !== hostId) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    // If questions are provided, replace them all in a transaction
    if (data.questions) {
      quizRepository.replaceQuestions(quizId, data.questions);
    }

    // Update quiz metadata fields (title, description, isPublished)
    const { questions: _questions, ...quizFields } = data;
    const updated = quizRepository.update(quizId, quizFields);
    if (!updated) {
      throw new NotFoundError('Quiz not found');
    }

    return updated;
  }

  deleteQuiz(quizId: string, hostId: string): void {
    const quiz = quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    if (quiz.hostId !== hostId) {
      throw new ForbiddenError('You do not have access to this quiz');
    }

    quizRepository.delete(quizId);
  }

  getQuizForGame(quizId: string): Quiz {
    const quiz = quizRepository.findById(quizId);
    if (!quiz) {
      throw new NotFoundError('Quiz not found');
    }

    return quiz;
  }
}

export const quizService = new QuizService();
