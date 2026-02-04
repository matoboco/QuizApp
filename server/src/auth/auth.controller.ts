import { Request, Response, NextFunction } from 'express';
import { ApiResponse, AuthResponse, AuthPendingVerification, AuthResult } from '@shared/types';
import { authService } from './auth.service';
import { RegisterInput, LoginInput, VerifyEmailInput, ResendCodeInput } from './auth.validation';
import { ConflictError, UnauthorizedError, BadRequestError } from '../middleware/error.middleware';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data: RegisterInput = req.body;
    const result = await authService.register(data);

    const response: ApiResponse<AuthPendingVerification> = {
      success: true,
      data: result,
      message: result.message,
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
    if (err instanceof BadRequestError) {
      const response: ApiResponse = {
        success: false,
        error: err.message,
      };
      res.status(400).json(response);
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

    if ('requiresVerification' in result) {
      const response: ApiResponse<AuthPendingVerification> = {
        success: true,
        data: result,
        message: result.message,
      };
      res.status(200).json(response);
      return;
    }

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

export async function verifyEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data: VerifyEmailInput = req.body;
    const result = await authService.verifyEmail(data);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: result,
      message: 'Email verified successfully',
    };

    res.status(200).json(response);
  } catch (err) {
    if (err instanceof BadRequestError) {
      const response: ApiResponse = {
        success: false,
        error: err.message,
      };
      res.status(400).json(response);
      return;
    }
    next(err);
  }
}

export async function resendCode(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data: ResendCodeInput = req.body;
    await authService.resendVerificationCode(data);

    const response: ApiResponse = {
      success: true,
      message: 'If the email is registered, a new verification code has been sent.',
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user || req.user.type !== 'host') {
      res.status(401).json({ success: false, error: 'Invalid token' });
      return;
    }

    const user = await authService.getUserPublic(req.user.userId);
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
    };

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}
