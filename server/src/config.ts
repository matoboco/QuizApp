import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtHostExpiry: process.env.JWT_HOST_EXPIRY || '24h',
  jwtPlayerExpiry: process.env.JWT_PLAYER_EXPIRY || '4h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dbPath: process.env.DB_PATH || './data/quiz.db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
