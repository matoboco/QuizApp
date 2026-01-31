/**
 * Convenience re-exports of all application error classes.
 *
 * The canonical definitions live in middleware/error.middleware.ts.
 * Import from here so that service / controller code does not depend
 * directly on the middleware barrel.
 */
export {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  BadRequestError,
} from '../middleware/error.middleware';
