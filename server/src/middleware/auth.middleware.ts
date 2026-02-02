import { Request, Response, NextFunction } from 'express';
import { TokenPayload } from '@shared/types';
import { authService } from '../auth/auth.service';
import { ApiResponse } from '@shared/types';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const response: ApiResponse = {
      success: false,
      error: 'No authentication token provided',
    };
    res.status(401).json(response);
    return;
  }

  const token = authHeader.slice(7); // Remove 'Bearer ' prefix

  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch {
    const response: ApiResponse = {
      success: false,
      error: 'Invalid or expired token',
    };
    res.status(401).json(response);
    return;
  }
}

export function requireHost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.type !== 'host') {
    const response: ApiResponse = {
      success: false,
      error: 'Host access required',
    };
    res.status(403).json(response);
    return;
  }

  next();
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.type !== 'host') {
    const response: ApiResponse = {
      success: false,
      error: 'Admin access required',
    };
    res.status(403).json(response);
    return;
  }

  const role = req.user.role;
  if (!role || !['admin', 'superadmin'].includes(role)) {
    const response: ApiResponse = {
      success: false,
      error: 'Admin access required',
    };
    res.status(403).json(response);
    return;
  }

  next();
}

export function requireSuperadmin(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.type !== 'host') {
    const response: ApiResponse = {
      success: false,
      error: 'Superadmin access required',
    };
    res.status(403).json(response);
    return;
  }

  const role = req.user.role;
  if (role !== 'superadmin') {
    const response: ApiResponse = {
      success: false,
      error: 'Superadmin access required',
    };
    res.status(403).json(response);
    return;
  }

  next();
}
