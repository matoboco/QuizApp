import { Request, Response, NextFunction } from 'express';
import { ApiResponse, Quiz, QuizSummary } from '@shared/types';
import { quizService } from './quiz.service';
import { CreateQuizInput, UpdateQuizInput } from './quiz.validation';

export async function createQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const data: CreateQuizInput = req.body;
    const quiz = await quizService.createQuiz(hostId, data);

    const response: ApiResponse<Quiz> = {
      success: true,
      data: quiz,
      message: 'Quiz created successfully',
    };

    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getQuizzes(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const quizzes = await quizService.getQuizzesByHost(hostId);

    const response: ApiResponse<QuizSummary[]> = {
      success: true,
      data: quizzes,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const quizId = req.params.id;
    const quiz = await quizService.getQuiz(quizId, hostId);

    const response: ApiResponse<Quiz> = {
      success: true,
      data: quiz,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const quizId = req.params.id;
    const data: UpdateQuizInput = req.body;
    const quiz = await quizService.updateQuiz(quizId, hostId, data);

    const response: ApiResponse<Quiz> = {
      success: true,
      data: quiz,
      message: 'Quiz updated successfully',
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const hostId = req.user!.userId;
    const quizId = req.params.id;
    await quizService.deleteQuiz(quizId, hostId);

    const response: ApiResponse = {
      success: true,
      message: 'Quiz deleted successfully',
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
