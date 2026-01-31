import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AuthResponse } from '@shared/types';
import { authService } from './auth.service';
import { RegisterInput, LoginInput } from './auth.validation';
import { ConflictError, UnauthorizedError } from '../middleware/error.middleware';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data: RegisterInput = req.body;
    const result = await authService.register(data);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Registration successful',
    };

    res.status(201).json(response);
  } catch (err) {
    if (err instanceof ConflictError) {
      const response: ApiResponse = {
        success: false,
        error: err.message,
      };
      res.status(409).json(response);
      return;
    }
    next(err);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data: LoginInput = req.body;
    const result = await authService.login(data);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Login successful',
    };

    res.status(200).json(response);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      const response: ApiResponse = {
        success: false,
        error: err.message,
      };
      res.status(401).json(response);
      return;
    }
    next(err);
  }
}

export function me(req: Request, res: Response): void {
  const user = req.user;

  const response: ApiResponse<typeof user> = {
    success: true,
    data: user,
  };

  res.status(200).json(response);
}
