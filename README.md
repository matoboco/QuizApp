# QuizApp

Real-time multiplayer quiz game. Host creates quizzes, players join via PIN and compete for the highest score.

## Features

### Quiz Management (Host)
- Create, edit and delete quizzes with multiple questions
- **4 question types**:
  - **Multiple Choice** - 2-4 answers, one correct
  - **True / False** - two fixed options
  - **Multi Select** - 2-8 answers, multiple correct (with optional partial credit)
  - **Ordering** - 2-8 items, players arrange in the correct order (partial credit)
- Configurable time limit per question (5-120 seconds)
- Optional image URL for questions
- Draft / published quiz states

### Real-time Gameplay
- Host generates a unique 6-digit PIN for each game session
- Players join with PIN + nickname (no registration required)
- QR code on lobby screen for quick join
- Live player list with connection status
- Automatic game flow: question → answers → results → leaderboard → next question
- Host can kick players from the lobby

### Scoring System
- **Base points**: 1000 per correct answer (scaled by correctness ratio for partial credit)
- **Time bonus**: up to 500 points for fast answers
- **Streak multiplier**: increases by 0.1x for each consecutive fully correct answer (max 2x)
- Incorrect answers reset streak to 0; partially correct answers also reset streak but still earn points
- **Multi Select partial credit**: `(correct selected - incorrect selected) / total correct` (min 0)
- **Ordering partial credit**: `items in correct position / total items`
- Individual score breakdown after each question

### Reconnection
- Players and hosts can reconnect after page refresh or network drop
- JWT-based session recovery
- Automatic state sync on reconnect

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js, TypeScript, Socket.IO |
| Database | SQLite (better-sqlite3) |
| Auth | JWT (host 24h, player 4h), bcrypt, email verification |
| Email | Nodemailer (MailPit for dev) |
| Validation | Zod |
| Real-time | Socket.IO (WebSocket) |
| Deployment | Docker Compose, Nginx |

### Email Verification
- New users must verify their email with a 6-digit code before accessing the app
- Unverified users who log in receive a fresh verification code automatically
- Configurable allowed email domains (`ALLOWED_EMAIL_DOMAINS` - comma-separated, empty = all allowed)
- Code expires after 10 minutes (configurable via `VERIFICATION_CODE_EXPIRY_MINUTES`)
- Resend button with 60-second cooldown

### Docker Deployment
- Single command deployment with `docker compose up -d --build`
- Nginx reverse proxy for the client
- MailPit for email testing (web UI at `http://localhost:8025`)
- Persistent SQLite volume

## Quick Start

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

### Docker

```bash
docker compose up -d --build
```

Open `http://localhost` (app) and `http://localhost:8025` (MailPit email UI).

### Test Credentials

```
Email:    test@example.com
Password: password123
```

Seed data includes 3 sample quizzes (World Geography, Science Basics, Pop Culture).

### Player Access

Players don't need an account. Open `http://localhost:5173/play` and enter the PIN shown on the host's lobby screen.

## Project Structure

```
QuizApp/
├── shared/types/        # Shared TypeScript interfaces
├── server/src/
│   ├── auth/            # JWT auth, login, register
│   ├── quiz/            # Quiz CRUD API
│   ├── game/            # Game engine, state manager, scoring
│   ├── socket/          # Socket.IO handlers, auth middleware
│   ├── db/              # SQLite schema, repositories, seed
│   └── middleware/       # Express error handling, auth guard
├── client/src/
│   ├── pages/           # Host (dashboard, editor, game) + Player (join, game)
│   ├── components/      # UI components (game phases, editor, effects)
│   ├── socket/          # Socket.IO hooks (useSocket, useGameSocket, useReconnection)
│   ├── context/         # AuthContext
│   ├── hooks/           # useHostGame, usePlayerGame, useQuizzes, etc.
│   ├── api/             # Axios HTTP clients
│   └── lib/             # Constants, utils, scoring
```

## Environment Variables

Server `.env` (defaults work for development):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `JWT_SECRET` | `dev-secret` | JWT signing key |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed client origin |
| `DB_PATH` | `./data/quiz.db` | SQLite file path |
| `SMTP_HOST` | `localhost` | SMTP server host |
| `SMTP_PORT` | `1025` | SMTP server port |
| `SMTP_SECURE` | `false` | Use TLS for SMTP |
| `SMTP_USER` | | SMTP auth username |
| `SMTP_PASS` | | SMTP auth password |
| `SMTP_FROM` | `QuizApp <noreply@quizapp.local>` | Sender address |
| `VERIFICATION_CODE_EXPIRY_MINUTES` | `10` | Code expiry time |
| `ALLOWED_EMAIL_DOMAINS` | | Comma-separated allowed domains (empty = all) |

## Game Flow

```
Lobby → Get Ready (3s) → Question (timer) → Time's Up (1.5s)
  → Answers (3s) → Results (5s) → Leaderboard (5s) → Next Question...
  → Final Results (after last question)
```

All transitions are automatic with status guards - host can also advance manually via on-screen controls.

## TODO

- [ ] Image upload for questions (currently URL only)
- [ ] Sound effects and music
- [ ] Open-ended question type
- [ ] Team mode
- [ ] Quiz import/export (JSON, CSV)
- [ ] Quiz duplication
- [ ] Post-game statistics and analytics for host
- [ ] Password reset / forgot password
- [ ] Rate limiting on API endpoints
- [ ] Unit and integration tests
- [x] Docker setup for deployment
- [x] Email verification at registration
- [ ] Production build and deployment guide
- [ ] Configurable auto-advance timing per quiz
- [ ] Player avatars / custom colors
- [ ] Lobby chat
