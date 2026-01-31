import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ApiResponse } from '@shared/types';
import { config } from '../config';

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(400, message);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

// ---------------------------------------------------------------------------
// Async handler wrapper – catches rejected promises and forwards to next()
// ---------------------------------------------------------------------------

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Wraps an async Express route handler so that any rejected promise is
 * automatically forwarded to the Express error-handling middleware.
 */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ---------------------------------------------------------------------------
// Central error-handling middleware
// ---------------------------------------------------------------------------

const isDev = config.nodeEnv !== 'production';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
    const response: ApiResponse = {
      success: false,
      error: `Validation failed: ${messages.join('; ')}`,
    };
    res.status(400).json(response);
    return;
  }

  // --- JWT errors ---
  if (err instanceof TokenExpiredError) {
    const response: ApiResponse = {
      success: false,
      error: 'Token has expired',
    };
    res.status(401).json(response);
    return;
  }

  if (err instanceof JsonWebTokenError) {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid token',
    };
    res.status(401).json(response);
    return;
  }

  // --- Application errors (our own hierarchy) ---
  if (err instanceof AppError) {
    if (isDev) {
      console.error(`[error] ${err.statusCode} - ${err.message}`);
      if (err.stack) console.error(err.stack);
    }

    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // --- Unknown / unexpected errors ---
  if (isDev) {
    console.error('[error] Unexpected error:', err);
    if (err.stack) console.error(err.stack);
  } else {
    // In production, log only a brief summary (no stack traces to stdout)
    console.error(`[error] Unexpected error: ${err.message}`);
  }

  const response: ApiResponse = {
    success: false,
    error: isDev ? err.message || 'Internal server error' : 'Internal server error',
  };
  res.status(500).json(response);
}

// Keep the named export that app.ts already imports
export { errorHandler as errorMiddleware };
