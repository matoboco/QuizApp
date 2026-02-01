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
- **Export / Import** quizzes as plain-text `.quiz.txt` files — human-readable, editable in any text editor, round-trip safe

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

### Quiz Export / Import

Export any quiz from the dashboard as a `.quiz.txt` file and import it back (or share it with others). The format is plain text, editable in any text editor:

```
# World Geography
> Test your knowledge of world capitals and landmarks

## What is the capital of France?
type: multiple-choice
* Paris
- London
- Berlin
- Madrid

## The Great Wall is in China
type: true-false
* True
- False

## Rank planets by distance from the Sun
type: ordering
time: 30
points: 2000
1. Mercury
2. Venus
3. Earth
4. Mars

## Select all prime numbers
type: multi-select
requireAll: true
* 2
* 3
- 4
* 5
- 6
```

Format rules:
- `# Title` and optional `> Description` at the top
- `## Question text` starts each question
- `type:` is required (`multiple-choice`, `true-false`, `multi-select`, `ordering`)
- `time:` and `points:` are optional (defaults: 20s, 1000pts)
- `* answer` = correct, `- answer` = wrong, `1. answer` = ordering position

## Game Flow

```
Lobby → Get Ready (3s) → Question (timer) → Time's Up (1.5s)
  → Answers (3s) → Results (5s) → Leaderboard (5s) → Next Question...
  → Final Results (after last question)
```

All transitions are automatic with status guards - host can also advance manually via on-screen controls.

## Quick Start

```bash
docker compose up -d --build
```

Open `http://localhost` (app) and `http://localhost:8025` (MailPit email UI).

See [Development Guide](docs/DEVELOPMENT.md) for local setup, environment variables, and test credentials.

## Docs

- [Tech Stack & Architecture](docs/TECH_STACK.md) — technologies, database, project structure
- [Development Guide](docs/DEVELOPMENT.md) — local setup, Docker, environment variables

## TODO

- [ ] Image upload for questions (currently URL only)
- [ ] Sound effects and music
- [ ] Open-ended question type
- [ ] Team mode
- [x] Quiz import/export (`.quiz.txt` plain-text format)
- [ ] Quiz duplication
- [ ] Post-game statistics and analytics for host
- [ ] Password reset / forgot password
- [ ] Rate limiting on API endpoints
- [ ] Unit and integration tests
- [x] Docker setup for deployment
- [x] Email verification at registration
- [x] PostgreSQL support (dual SQLite/PostgreSQL via Kysely)
- [ ] Production build and deployment guide
- [ ] Configurable auto-advance timing per quiz
- [ ] Player avatars / custom colors
- [ ] Lobby chat
