# Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Express.js, TypeScript, Socket.IO |
| Database | SQLite (better-sqlite3) or PostgreSQL — selectable via `DB_TYPE` env |
| Query Builder | Kysely (type-safe, dialect-agnostic) |
| Auth | JWT (host 24h, player 4h), bcrypt, email verification |
| Email | Nodemailer (MailPit for dev) |
| Validation | Zod |
| Real-time | Socket.IO (WebSocket) |
| Deployment | Docker Compose, Nginx |

## Database

- **Dual database support** — switch between SQLite and PostgreSQL via a single env variable (`DB_TYPE=sqlite|postgres`)
- Kysely query builder provides type-safe, dialect-agnostic queries — the same codebase runs against both databases
- Built-in migration system (`001_initial_schema`) runs automatically on startup
- Migration script to transfer existing SQLite data to PostgreSQL: `npm run migrate-to-postgres`

## Email Verification

- New users must verify their email with a 6-digit code before accessing the app
- Unverified users who log in receive a fresh verification code automatically
- Configurable allowed email domains (`ALLOWED_EMAIL_DOMAINS` - comma-separated, empty = all allowed)
- Code expires after 10 minutes (configurable via `VERIFICATION_CODE_EXPIRY_MINUTES`)
- Resend button with 60-second cooldown

## Project Structure

```
QuizApp/
├── shared/types/        # Shared TypeScript interfaces
├── server/src/
│   ├── auth/            # JWT auth, login, register
│   ├── quiz/            # Quiz CRUD API
│   ├── game/            # Game engine, state manager, scoring
│   ├── socket/          # Socket.IO handlers, auth middleware
│   ├── db/              # Kysely connection, migrations, repositories, seed
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
