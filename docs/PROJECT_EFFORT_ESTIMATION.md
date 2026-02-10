# QuizBonk - Odhad pracnosti projektu

## 1. Zhrnutie projektu

**QuizBonk** je real-time multiplayerova kvizova aplikacia, ktora umoznuje hostitelom vytvarat kvizy a hracom sa pripajat cez PIN kod a suazit o najvyssi pocet bodov v realnom case.

| Parameter | Hodnota |
|-----------|---------|
| **Typ aplikacie** | Webova real-time multiplayerova hra |
| **Architektura** | Monorepo (client + server + shared types) |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Express.js, TypeScript, Socket.IO |
| **Databaza** | SQLite / PostgreSQL (Kysely ORM) |
| **Real-time komunikacia** | Socket.IO (WebSocket) |
| **Autentifikacia** | JWT + bcrypt + email verifikacia |
| **Deployment** | Docker Compose, Nginx |
| **Celkovy pocet suborov** | 162 TypeScript suborov |
| **Celkovy pocet riadkov kodu** | ~14 900 LOC |

---

## 2. Porovnanie dokumentacie so zdrojovym kodom

### 2.1 Co je zdokumentovane a implementovane

| Funkcionalita (z README.md) | Stav v kode | Poznamka |
|------------------------------|-------------|----------|
| 5 typov otazok (MC, T/F, Multi-Select, Ordering, Number-Guess) | Implementovane | Kompletne na FE aj BE vcetane scoringu |
| Konfiguracia casoveho limitu (5-120s) | Implementovane | TimeLimitSlider.tsx + validacia na BE |
| Volitelny popis/hint k otazke | Implementovane | Migracia 002, QuestionEditor.tsx |
| Volitelny obrazok (URL) | Implementovane | Len ako URL, nie upload suboru |
| 8 farieb a tvarov pre odpovede | Implementovane | 9 Shape komponentov, constants.ts |
| Public/Private viditelnost kvizov | Implementovane | QuizSettingsForm.tsx, quiz.service.ts |
| Duplikacia kvizov | Implementovane | quiz.service.ts, QuizCard.tsx |
| Edit lock (po odohrani) | Implementovane | hasGames() kontrola v quiz.service.ts |
| Export/Import .quiz.txt | Implementovane | quizTxt.ts (416 LOC parser), ImportQuizButton.tsx |
| 6-ciferny PIN pre hru | Implementovane | pin-generator.ts, LobbyScreen.tsx |
| QR kod na pripojenie | Implementovane | QRCode.React kniznica, LobbyScreen.tsx |
| Automaticky game flow | Implementovane | game.engine.ts - 6 faz s auto-prechodmi |
| Scoring system (zaklad + cas + streak) | Implementovane | answer-checker.ts, scoring.ts (shared) |
| Admin panel (role, statistiky) | Implementovane | 10 API endpointov, AdminDashboardPage.tsx |
| Historia hier a statistiky | Implementovane | 6 API endpointov, grafy, zdielanie |
| Reconnection (JWT obnova session) | Implementovane | reconnection.handler.ts, useReconnection.ts |
| Docker setup | Implementovane | docker-compose.yml + sqlite varianta |
| Email verifikacia | Implementovane | email.service.ts, VerifyEmailPage.tsx |
| Dual DB podpora (SQLite + PostgreSQL) | Implementovane | Kysely dialekty, migracny skript |

### 2.2 Polozky z TODO zoznamu (neimplementovane)

| TODO polozka | Stav | Odhad narocnosti |
|--------------|------|-----------------|
| Upload obrazkov pre otazky | Neimplementovane | Stredna (potreba storage backendu) |
| Zvukove efekty a hudba | Neimplementovane | Nizka-stredna |
| Open-ended otazka (volny text) | Neimplementovane | Stredna |
| Timovy mod | Neimplementovane | Vysoka (zmena game engine) |
| Reset hesla (self-service) | Neimplementovane | Nizka |
| Rate limiting na API | Neimplementovane | Nizka |
| Unit a integracne testy | Neimplementovane | Vysoka (0 testov aktualne) |
| Produkcny deployment guide | Neimplementovane | Nizka |
| Konfigurovatelne casovanie auto-advance | Neimplementovane | Nizka |
| Avatary hracov | Neimplementovane | Nizka-stredna |
| Lobby chat | Neimplementovane | Stredna |

### 2.3 Dokumentacia vs. realita - zistenia

- **TECH_STACK.md** presne zodpoveda pouzitym technologiam v package.json
- **DEVELOPMENT.md** obsahuje spravne instrukcie pre local setup aj Docker
- **README.md** je aktualny a komplexny - vsetky uvedene features su implementovane
- **Ziadne testy** - projekt nema ziadne unit ani integracne testy, co je v TODO

---

## 3. Kvantitativna analyza zdrojoveho kodu

### 3.1 Backend (server/)

| Modul | Subory | LOC | Komplexita | Popis |
|-------|--------|-----|------------|-------|
| Entry point + Config | 3 | 243 | Nizka | HTTP server, Express app, env config |
| Autentifikacia (auth/) | 5 | 486 | Stredna | Register, login, JWT, email verifikacia |
| Kviz management (quiz/) | 4 | 484 | Stredna-vysoka | CRUD, 5 typov otazok, validacia, duplikacia |
| **Game engine (game/)** | **8** | **1 395** | **Vysoka** | **Real-time herny engine, stavovy automat, scoring** |
| Historia (history/) | 3 | 579 | Stredna | Analyticke dotazy, zdielanie, agregacie |
| Admin (admin/) | 3 | 484 | Stredna | User management, role, statistiky |
| Socket.IO (socket/) | 3 | 586 | Vysoka | Event handling, autentifikacia, reconnection |
| Databaza (db/) | 13 | 1 456 | Stredna | Schema, migacie (5), repositories (6), seed |
| Middleware | 3 | 299 | Nizka-stredna | Auth guard, validacia, error handling |
| Utilities | 2 | 52 | Nizka | Error classes, PIN generator |
| **Backend celkom** | **47** | **~6 064** | | |

### 3.2 Frontend (client/)

| Oblast | Subory | LOC | Komplexita | Popis |
|--------|--------|-----|------------|-------|
| Stranky - Auth | 3 | 504 | Stredna | Login, registracia, verifikacia emailu |
| Stranky - Host | 3 | 721 | Vysoka | Dashboard, editor, game hosting |
| Stranky - Hrac | 2 | 618 | Vysoka | Join PIN, game hracsky interface |
| Stranky - Historia | 3 | 536 | Stredna | Zoznam hier, detail, zdielana stranka |
| Stranky - Admin | 2 | 587 | Stredna | Dashboard, sprava uzivatelov |
| Komponenty - Common | 6 | 407 | Nizka | Button, Input, Modal, Toast, Spinner, Skeleton |
| Komponenty - Host game | 11 | 1 177 | Vysoka | Game phases, lobby, leaderboard, timer |
| Komponenty - Player game | 13 | 1 300 | Vysoka | Answer grids (5 typov), vysledky, PIN input |
| Komponenty - Editor | 7 | 790 | Vysoka | Question editor, answer editor, sidebar |
| Komponenty - Quiz mgmt | 5 | 592 | Stredna | QuizCard, import, delete dialog |
| Komponenty - Historia | 3 | 360 | Stredna | Grafy, tabulky, statistiky |
| Komponenty - Efekty | 5 | 596 | Stredna | Podium, confetti, countdown, animacie |
| Komponenty - Tvary | 9 | 318 | Nizka | SVG tvary pre odpovede |
| Komponenty - Layout/Guards | 4 | ~200 | Nizka | Header, layout, route guards |
| Hooks | 7 | 704 | Vysoka | Quiz editor state, game hooks |
| Socket/Real-time | 4 | 862 | Velmi vysoka | WebSocket lifecycle, reconnection |
| API klienti | 6 | 248 | Nizka | Axios wrappery pre REST API |
| Context | 3 | 255 | Stredna | Auth, Toast, Socket context |
| Utilities | 3 | 453 | Stredna | Quiz text parser (416 LOC), helpers |
| **Frontend celkom** | **~99** | **~10 228** | | |

### 3.3 Shared types

| Subor | Obsah |
|-------|-------|
| quiz.ts | 10+ interfaces - typy otazok, kviz, odpovede |
| game.ts | 8 interfaces - GameSession, Player, GameState |
| socket-events.ts | 4 interfaces - 15+ typovanych socket eventov |
| scoring.ts | Scoring logika, breakdown typy |
| auth.ts | User, JWT payload, auth requesty |
| api.ts | ApiResponse, paginacia |
| admin.ts | Admin-specificke typy |
| history.ts | Historia a statistiky typy |
| **Celkom** | **9 suborov, ~500 LOC** |

### 3.4 Infrastruktura

| Polozka | Subory | Popis |
|---------|--------|-------|
| Docker | 4 | 2x Dockerfile (client, server), 2x docker-compose |
| Nginx | 1 | Reverse proxy konfiguracia |
| TypeScript config | 2 | tsconfig.json (client + server) |
| Tailwind/PostCSS | 2 | Styling pipeline |
| Environment | 1 | .env.example template |

---

## 4. Analyza API a komunikacie

### 4.1 REST API endpointy (32 celkom)

| Modul | Pocet | Metody |
|-------|-------|--------|
| Auth | 5 | POST register, POST login, POST verify, POST resend-code, GET me |
| Quiz | 8 | POST create, GET list, GET detail, PUT update, DELETE, GET public, GET public-detail, POST duplicate |
| Game | 3 | POST create, POST join, GET detail |
| History | 6 | GET quiz-games, GET game-detail, GET question-stats, GET rankings, POST share, GET shared |
| Admin | 9 | GET stats, GET users, GET user, POST deactivate, POST activate, POST reset-pwd, PUT email, DELETE user, PUT role |
| Health | 1 | GET health |

### 4.2 Socket.IO eventy (24+ celkom)

| Smer | Pocet | Hlavne eventy |
|------|-------|---------------|
| Host → Server | 7 | start-game, next-question, show-answers, show-result, show-leaderboard, end-game, kick-player |
| Player → Server | 2 | join, submit-answer |
| Spolocne | 1 | reconnect-game |
| Server → Klienti | 14+ | state-update, player-joined, countdown, time-up, leaderboard, answer-distribution, finished... |

### 4.3 Databazova schema (8 tabuliek)

| Tabulka | Stlpce | Vztahy |
|---------|--------|--------|
| users | id, email, username, password, role, is_active, is_verified | 1:N quizzes, game_sessions |
| email_verification_codes | id, user_id, email, code, expires_at, used | N:1 users |
| quizzes | id, host_id, title, description, is_public, created_at | 1:N questions, game_sessions |
| questions | id, quiz_id, text, type, time_limit, points, order_index, description, image_url, correct_number, tolerance | 1:N answers |
| answers | id, question_id, text, is_correct, order_index | N:1 questions |
| game_sessions | id, quiz_id, host_id, pin, status, share_token, started_at, finished_at | 1:N players, player_answers |
| players | id, session_id, nickname, score, is_connected | N:1 game_sessions |
| player_answers | id, session_id, player_id, question_id, answer, is_correct, score, response_time | N:1 players, game_sessions |

---

## 5. Odhad pracnosti pre trojclenny tim

### 5.1 Zlozenie timu

| Rola | Zodpovednosti |
|------|---------------|
| **BE Developer** | Backend API, databaza, game engine, Socket.IO, autentifikacia, Docker infrastruktura |
| **FE Developer** | React komponenty, stranky, hooks, real-time UI, styling, animacie, responsive design |
| **Analytik / Tester** | Analyza poziadaviek, navrh UI/UX, testovanie, dokumentacia, koordinacia, QA |

### 5.2 Odhad po fazach vyvoja

---

#### FAZA 1: Analyza a navrh

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| Zbieranie a analyza poziadaviek | Analytik | 3 |
| Navrh architektury (monorepo, tech stack vyber) | BE + FE + Analytik | 2 |
| Navrh databazovej schemy (8 tabuliek, vztahy) | BE + Analytik | 2 |
| Navrh API kontraktu (32 endpointov + socket eventy) | BE + Analytik | 3 |
| Navrh UI/UX wireframy (13 stranok, game flow) | FE + Analytik | 5 |
| Navrh hernej logiky (scoring, phases, reconnection) | BE + Analytik | 3 |
| Navrh zdielanych typov (shared types) | BE + FE | 1 |
| Definicia akceptacnych kriterii | Analytik | 2 |
| **Medzisucet Faza 1** | | **21 clovekodni** |

**Trvanie fazy: ~2 tyzdne** (pri paralelnej praci)

---

#### FAZA 2: Zakladna infrastruktura a setup

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| Inicializacia monorepo struktury | BE | 1 |
| Setup Express + TypeScript + Kysely | BE | 2 |
| Setup React + Vite + TypeScript + Tailwind | FE | 2 |
| Databazove migacie (zakladna schema) | BE | 3 |
| Repository pattern implementacia (6 repositories) | BE | 4 |
| Middleware (auth, error handling, validacia) | BE | 2 |
| Axios klient + interceptory | FE | 1 |
| Shared types definicia | BE + FE | 2 |
| Docker setup (Dockerfile, docker-compose) | BE | 2 |
| Nginx konfiguracia | BE | 1 |
| Priprava testovacieho prostredia | Analytik | 2 |
| **Medzisucet Faza 2** | | **22 clovekodni** |

**Trvanie fazy: ~2 tyzdne**

---

#### FAZA 3: Autentifikacia a zakladne UI

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| Auth API (register, login, JWT) | BE | 3 |
| Email verifikacia (nodemailer, kody) | BE | 2 |
| Auth validacie (Zod schemy) | BE | 1 |
| AuthContext + ProtectedRoute | FE | 2 |
| Login stranka | FE | 2 |
| Registracna stranka | FE | 2 |
| Email verifikacia stranka | FE | 2 |
| Common komponenty (Button, Input, Modal, Toast, Spinner) | FE | 3 |
| Layout (Header, MainLayout) | FE | 2 |
| Testovanie auth flow | Analytik | 3 |
| **Medzisucet Faza 3** | | **22 clovekodni** |

**Trvanie fazy: ~2 tyzdne**

---

#### FAZA 4: Sprava kvizov

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| Quiz CRUD API (8 endpointov) | BE | 4 |
| Validacia 5 typov otazok (Zod) | BE | 3 |
| Quiz service logika (duplikacia, edit lock, public/private) | BE | 3 |
| Dashboard stranka (My Quizzes + Public Quizzes taby) | FE | 4 |
| QuizCard komponent (akcie: play, edit, export, duplicate, delete) | FE | 3 |
| Quiz editor stranka (3-panelovy layout) | FE | 5 |
| QuestionEditor (dynamicke formulare podla typu otazky) | FE | 5 |
| AnswerEditor (spravne/nespravne prepinanie, min/max odpovedi) | FE | 3 |
| QuestionList sidebar (preradovanie, drag-and-drop) | FE | 2 |
| useQuizEditor hook (komplexny state management) | FE | 4 |
| useAutoSave hook | FE | 2 |
| Import/Export .quiz.txt parser (416 LOC state machine) | FE | 5 |
| Testovanie spravy kvizov | Analytik | 4 |
| **Medzisucet Faza 4** | | **47 clovekodni** |

**Trvanie fazy: ~3.5 tyzdna**

---

#### FAZA 5: Herny engine (NAJKOMPLEXNEJSIA FAZA)

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| Socket.IO setup + autentifikacia | BE | 3 |
| Game state manager (in-memory stavovy automat) | BE | 8 |
| Game engine (fazove prechody, casovace, auto-advance) | BE | 10 |
| Answer checker (5 typov, partial credit, streak) | BE | 5 |
| Leaderboard logika (kumulativne body, tie-breaking) | BE | 2 |
| Socket event handlers (host + player + broadcast) | BE | 5 |
| Reconnection handler (obnova session, state sync) | BE | 4 |
| Game cleanup (stale session cistenie) | BE | 1 |
| Game API endpointy (create, join, get) | BE | 2 |
| Socket.IO klient + hooks (useSocket, useGameSocket) | FE | 5 |
| useReconnection hook (session storage, retry) | FE | 3 |
| Host Lobby screen (PIN, QR kod, player list) | FE | 3 |
| Host GamePresentation (phase router) | FE | 2 |
| Host QuestionPhase (otazka + countdown) | FE | 3 |
| Host AnswersPhase + ResultPhase | FE | 2 |
| Host LeaderboardPhase + FinalResults | FE | 4 |
| Host GameControls (manualne ovladanie) | FE | 2 |
| AnswerDistributionChart | FE | 2 |
| Player PinInput + NicknameInput | FE | 3 |
| Player AnswerGrid (router pre 5 typov) | FE | 2 |
| Player answer komponenty (MC, T/F, Multi-Select, Ordering, Number-Guess) | FE | 6 |
| Player vysledkove obrazovky (per-question, final) | FE | 4 |
| Player WaitingScreen + StreakIndicator | FE | 2 |
| CountdownCircle + CountdownTimer vizualy | FE | 2 |
| Integracne testovanie herneho flow | Analytik | 8 |
| Testovanie reconnection scenariov | Analytik | 3 |
| Testovanie scoring systemu (vsetky typy) | Analytik | 4 |
| **Medzisucet Faza 5** | | **100 clovekodni** |

**Trvanie fazy: ~7 tyzdnov**

---

#### FAZA 6: Vizualne efekty a animacie

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| Shape SVG komponenty (9 tvarov) | FE | 2 |
| PodiumAnimation (top 3 animacia) | FE | 3 |
| ConfettiExplosion efekt | FE | 2 |
| CountdownCircle animacia | FE | 2 |
| ScorePopup + SlideIn animacie | FE | 2 |
| Testovanie vizualnych efektov na roznych zariadeniach | Analytik | 2 |
| **Medzisucet Faza 6** | | **13 clovekodni** |

**Trvanie fazy: ~1 tyzden**

---

#### FAZA 7: Admin panel

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| Admin API (10 endpointov) | BE | 4 |
| Role-based access control (admin vs superadmin) | BE | 2 |
| Admin statisticke dotazy | BE | 2 |
| AdminGuard komponent | FE | 1 |
| AdminDashboard stranka (KPI statistiky) | FE | 2 |
| AdminUsersPage (tabulka, vyhladavanie, paginacia) | FE | 5 |
| Akcie na uzivateloch (deaktivacia, reset hesla, zmena role) | FE | 3 |
| Testovanie admin funkcionalit | Analytik | 3 |
| **Medzisucet Faza 7** | | **22 clovekodni** |

**Trvanie fazy: ~2 tyzdne**

---

#### FAZA 8: Historia hier a statistiky

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| History API (6 endpointov, agregacne dotazy) | BE | 4 |
| Share token generovanie + public pristup | BE | 2 |
| QuizHistoryPage (zoznam odohanych hier) | FE | 2 |
| GameHistoryPage (3-tab: hraci, otazky, ranking) | FE | 4 |
| PlayerResultsTable (trieditelna tabulka) | FE | 2 |
| QuestionStatsPanel (distribucne grafy) | FE | 2 |
| RankingChart (line chart progresie) | FE | 3 |
| SharedGamePage (verejne vysledky) | FE | 2 |
| Testovanie statistik a zdielania | Analytik | 3 |
| **Medzisucet Faza 8** | | **24 clovekodni** |

**Trvanie fazy: ~2 tyzdne**

---

#### FAZA 9: Doladenie, integracne testovanie a deployment

| Cinnost | Zodpovednost | Odhad (clovekodni) |
|---------|-------------- |---------------------|
| End-to-end integracne testovanie | Analytik | 5 |
| Testovanie na mobilnych zariadeniach (responsive) | Analytik | 3 |
| Testovanie Docker deploymentu | BE + Analytik | 2 |
| Databazova migracia SQLite → PostgreSQL testovanie | BE | 1 |
| Seed data priprava | BE | 1 |
| Opravy chyb z testovania | BE + FE | 5 |
| Performance kontrola (WebSocket zataz) | BE | 2 |
| Bezpecnostna kontrola (JWT, validacia, XSS) | Analytik | 2 |
| Finalizacia dokumentacie | Analytik | 2 |
| **Medzisucet Faza 9** | | **23 clovekodni** |

**Trvanie fazy: ~2 tyzdne**

---

## 6. Suhrn odhadu

### 6.1 Celkovy odhad po fazach

| Faza | Nazov | Clovekodni | Trvanie (paralelne) |
|------|-------|------------|---------------------|
| 1 | Analyza a navrh | 21 | 2 tyzdne |
| 2 | Infrastruktura a setup | 22 | 2 tyzdne |
| 3 | Autentifikacia a zakladne UI | 22 | 2 tyzdne |
| 4 | Sprava kvizov | 47 | 3.5 tyzdna |
| 5 | **Herny engine (real-time)** | **100** | **7 tyzdnov** |
| 6 | Vizualne efekty a animacie | 13 | 1 tyzden |
| 7 | Admin panel | 22 | 2 tyzdne |
| 8 | Historia a statistiky | 24 | 2 tyzdne |
| 9 | Integracne testovanie a deployment | 23 | 2 tyzdne |
| | **CELKOM** | **294 clovekodni** | **~23.5 tyzdna** |

### 6.2 Rozdelenie prace podla roli

| Rola | Clovekodni | Podiel |
|------|------------|--------|
| **BE Developer** | 115 | 39% |
| **FE Developer** | 131 | 45% |
| **Analytik / Tester** | 48 | 16% |
| **Celkom** | **294** | **100%** |

### 6.3 Casovy plan (timeline)

Pri 3-clennom time pracujucom paralelne:

```
Tyzden  1-2   ████████████████████  Faza 1: Analyza a navrh
Tyzden  3-4   ████████████████████  Faza 2: Infrastruktura a setup
Tyzden  5-6   ████████████████████  Faza 3: Autentifikacia a zakladne UI
Tyzden  7-10  ████████████████████████████  Faza 4: Sprava kvizov
Tyzden 11-17  ████████████████████████████████████████████  Faza 5: Herny engine
Tyzden 17-18  ██████████  Faza 6: Vizualne efekty (parallel s fazou 5)
Tyzden 18-19  ████████████████████  Faza 7: Admin panel
Tyzden 20-21  ████████████████████  Faza 8: Historia a statistiky
Tyzden 22-23  ████████████████████  Faza 9: Testovanie a deployment
```

**Celkove trvanie projektu: ~23-24 tyzdnov (~6 mesiacov)**

### 6.4 Odhad s rezervou

| Scenar | Clovekodni | Trvanie |
|--------|------------|---------|
| **Optimisticky** (bez komplikacii) | 250 | ~20 tyzdnov (5 mesiacov) |
| **Realisticky** (standardna rezerva +15%) | 338 | ~24 tyzdnov (6 mesiacov) |
| **Pesimisticky** (komplikacie, zmeny poziadaviek +30%) | 382 | ~28 tyzdnov (7 mesiacov) |

---

## 7. Identifikovane rizika

| Riziko | Dopad | Pravdepodobnost | Mitigacia |
|--------|-------|-----------------|-----------|
| Komplexita real-time synchronizacie | Vysoky | Stredna | Dostatocny cas na fazu 5, early prototyping |
| Reconnection edge cases | Stredny | Vysoka | Rozsiahlne testovanie scenariov odpojenia |
| Race conditions v game engine | Vysoky | Stredna | Code review, integracne testy |
| Responsive design na roznych zariadeniach | Stredny | Stredna | Priebezne testovanie na mobiloch |
| Absencia testov (0 unit testov) | Vysoky | Vysoka | Dedickovana faza na testy ak su pozadovane |
| Skalovatelnost (in-memory game state) | Stredny | Nizka | Pre MVP postacujuce, Redis pre scale-up |
| Zmena poziadaviek pocas vyvoja | Stredny | Stredna | Agile iteracie, buffer v odhade |

---

## 8. Technicke metriky projektu

### 8.1 Komplexita podla modulu

| Modul | LOC | Komplexita | Riziko |
|-------|-----|-----------|--------|
| Game engine + Socket.IO | 2 848 | **Velmi vysoka** | **Vysoke** |
| Quiz editor (FE + BE) | 1 914 | Vysoka | Stredne |
| Autentifikacia | 1 244 | Stredna | Nizke |
| Admin panel | 1 571 | Stredna | Nizke |
| Historia a statistiky | 1 539 | Stredna | Nizke |
| Databazova vrstva | 1 456 | Stredna | Nizke |
| UI komponenty a efekty | 2 521 | Stredna | Nizke |
| Infrastruktura/config | ~300 | Nizka | Nizke |

### 8.2 Pocty funkcionalit

| Kategoria | Pocet |
|-----------|-------|
| REST API endpointy | 32 |
| Socket.IO eventy | 24+ |
| Databazove tabulky | 8 |
| Databazove migacie | 5 |
| Repository metody | ~49 |
| React stranky/routes | 13 |
| React komponenty | 63 |
| Custom hooks | 7 |
| Typy otazok | 5 |
| Herny fazy | 7 (lobby, starting, question, answers, result, leaderboard, finished) |

---

## 9. Zaver

QuizBonk je **stredne az vysoko komplexny projekt**, ktoreho hlavnou vyzvou je **real-time herny engine** s WebSocket komunikaciou, stavovym automatom a viacerymi typmi otazok s roznym scoring algoritmom.

Pre trojclenny tim (BE developer, FE developer, analytik/tester) je realisticky odhad **~6 mesiacov** na kompletnu implementaciu vsetkych existujucich funkcionalit, vratane infrastruktury a deploymentu.

Najnarocnejsia cast projektu (Faza 5 - herny engine) tvori **34% celkoveho usilia** a vyzaduje uzku spolupracu medzi BE a FE developermi kvoli real-time synchronizacii stavu medzi serverom a klientmi cez WebSocket.

---

*Dokument vygenerovany na zaklade analyzy zdrojoveho kodu projektu QuizBonk.*
*Datum: 2026-02-03*
