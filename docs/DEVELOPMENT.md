# Development Guide

## Quick Start (local)

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Seed database with test data
cd ../server && npm run seed

# Start server (port 3001)
npm run dev

# In another terminal - start client (port 5173)
cd client && npm run dev
```

Open `http://localhost:5173` in browser.

## Docker

### PostgreSQL (default)

```bash
docker compose up -d --build
```

### SQLite

```bash
docker compose -f docker-compose.yml -f docker-compose.sqlite.yml up -d --build
```

Open `http://localhost` (app) and `http://localhost:8025` (MailPit email UI).

### Migrate SQLite data to PostgreSQL

```bash
cd server && npm run migrate-to-postgres
```

## Test Credentials

```
Email:    test@example.com
Password: password123
```

Seed data includes 3 sample quizzes (World Geography, Science Basics, Pop Culture).

## Player Access

Players don't need an account. Open `http://localhost:5173/play` and enter the PIN shown on the host's lobby screen.

## Environment Variables

Server `.env` (defaults work for development):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | `dev-secret` | JWT signing key |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed client origin |
| `DB_TYPE` | `sqlite` | Database engine: `sqlite` or `postgres` |
| `DB_PATH` | `./data/quiz.db` | SQLite file path (only when `DB_TYPE=sqlite`) |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `POSTGRES_DB` | `quizbonk` | PostgreSQL database name |
| `POSTGRES_USER` | `quizbonk` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `quizbonk` | PostgreSQL password |
| `POSTGRES_POOL_MAX` | `20` | Connection pool size (increase for 50+ players) |
| `SMTP_HOST` | `localhost` | SMTP server host |
| `SMTP_PORT` | `1025` | SMTP server port |
| `SMTP_SECURE` | `false` | Use TLS for SMTP |
| `SMTP_USER` | | SMTP auth username |
| `SMTP_PASS` | | SMTP auth password |
| `SMTP_FROM` | `QuizBonk <noreply@quizbonk.com>` | Sender address |
| `VERIFICATION_CODE_EXPIRY_MINUTES` | `10` | Code expiry time |
| `ALLOWED_EMAIL_DOMAINS` | | Comma-separated allowed domains (empty = all) |
