import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtHostExpiry: process.env.JWT_HOST_EXPIRY || '24h',
  jwtPlayerExpiry: process.env.JWT_PLAYER_EXPIRY || '4h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  dbPath: process.env.DB_PATH || './data/quiz.db',
  dbType: (process.env.DB_TYPE || 'sqlite') as 'sqlite' | 'postgres',
  postgres: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'quizbonk',
    user: process.env.POSTGRES_USER || 'quizbonk',
    password: process.env.POSTGRES_PASSWORD || 'quizbonk',
    poolMax: parseInt(process.env.POSTGRES_POOL_MAX || '20', 10),
  },
  basePath: (process.env.BASE_PATH || '').replace(/\/+$/, ''),
  nodeEnv: process.env.NODE_ENV || 'development',
  smtp: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '1025', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'QuizBonk <noreply@quizbonk.com>',
  },
  verificationCodeExpiryMinutes: parseInt(process.env.VERIFICATION_CODE_EXPIRY_MINUTES || '10', 10),
  allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS || '')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
};
