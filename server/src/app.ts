import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config';
import { authRouter } from './auth/auth.routes';
import { quizRouter } from './quiz/quiz.routes';
import { gameRouter } from './game/game.routes';
import { errorMiddleware } from './middleware/error.middleware';

const app = express();

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------------------------------------------------------------------
// Request logging middleware
// ---------------------------------------------------------------------------
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Once the response finishes, log method, url, status, and duration
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[http] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });

  next();
});

// ---------------------------------------------------------------------------
// Rate limiting (placeholder)
// ---------------------------------------------------------------------------
// TODO: Add rate limiting middleware here.
// Example with express-rate-limit:
//
//   import rateLimit from 'express-rate-limit';
//   const limiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutes
//     max: 100,                 // limit each IP to 100 requests per window
//     standardHeaders: true,
//     legacyHeaders: false,
//   });
//   app.use('/api/', limiter);

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRouter);
app.use('/api/quizzes', quizRouter);

app.use('/api/games', gameRouter);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// 404 handler - must come after all route registrations
// ---------------------------------------------------------------------------
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// ---------------------------------------------------------------------------
// Error middleware - must be the last app.use()
// ---------------------------------------------------------------------------
app.use(errorMiddleware);

export default app;
