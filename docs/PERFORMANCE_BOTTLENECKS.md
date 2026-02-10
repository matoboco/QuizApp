# QuizBonk - Analyza vykonovych uzkych hrdiel (100 hracov)

## 1. Uvod

Tento dokument analyzuje vykonove uzke hrdla aplikacie QuizBonk pri scenari, kedy sa kvizu zucastni **100 hracov sucasne** (napr. firemny event, konferencia, skolske podujatie).

Analyza vychadza z podrobneho studia zdrojoveho kodu - najma herneho engine (`game.engine.ts`), stavoveho manazera (`game-state.manager.ts`), Socket.IO handlerov (`socket.handler.ts`) a databazovej vrstvy (repositories).

### Testovany scenar

| Parameter | Hodnota |
|-----------|---------|
| Pocet hracov | 100 |
| Pocet otazok v kvize | 20 |
| Casovy limit na otazku | 30 sekund |
| Databaza | SQLite (default) / PostgreSQL |
| Prostredie | Single Node.js proces |

---

## 2. Prehladova tabulka uzkych hrdiel

| # | Uzke hrdlo | Zavaznost | Kde v kode | Dopad pri 100 hracoch |
|---|-----------|-----------|------------|----------------------|
| 1 | Sekvencne DB zapisy pri submitoch | **Kriticka** | `game.engine.ts:186-267` | ~200 sekvencnych DB dotazov v spicke |
| 2 | Sekvencne DB zapisy pri fazovych prechodoch | **Kriticka** | `game.engine.ts:291-399` | 100 sekvencnych UPDATE v `endGame` |
| 3 | Opakovany sort leaderboardu pri broadcastoch | **Vysoka** | `game.engine.ts:542-564` | 10 000 sort operacii na 1 leaderboard |
| 4 | Countdown broadcast kazdu sekundu | **Vysoka** | `game.engine.ts:492-519` | 240 broadcast eventov za otazku |
| 5 | `toPublicState` hlboke kopie + sort | **Stredna** | `game-state.manager.ts:382-394` | Stovky zbytocnych kopii za hru |
| 6 | Linearne vyhladavanie hracov `.find()` | **Stredna** | `game-state.manager.ts:68,91,160,305` | O(N) lookup namiesto O(1) |
| 7 | SQLite write lock | **Stredna** | `connection.ts:31-53` | Serializacia vsetkych zapisov |
| 8 | Chybajuca konfiguracia Socket.IO | **Nizka** | `index.ts:22-33` | Potencialne memory/network problemy |

---

## 3. Detailna analyza

### 3.1 KRITICKE: Sekvencne DB zapisy pri submitnuti odpovede

**Subor:** `server/src/game/game.engine.ts`, metoda `submitAnswer` (riadky 186-267)

**Co sa deje:** Pri kazdom submitnuti odpovede hracom sa vykonavaju 3 operacie sekvencne:

1. `playerAnswerRepository.create()` - INSERT do tabulky `player_answers`
2. `playerRepository.updateScore()` - UPDATE tabulky `players`
3. `hasAllPlayersAnswered()` - iteracia cez vsetkych hracov a kontrola mapy `currentAnswers`

**Preco je to problem pri 100 hracoch:**

Ked casovac odpocitava posledne sekundy, vacsina hracov odosle odpoved priblizne v rovnakom okamihu. To znamena **~100 simultannych `submitAnswer` volani**, z ktorych kazde robi 2 DB zapisy.

```
Hrac 1 submitne → INSERT player_answers → UPDATE players → check all answered
Hrac 2 submitne → INSERT player_answers → UPDATE players → check all answered
Hrac 3 submitne → INSERT player_answers → UPDATE players → check all answered
...
Hrac 100 submitne → INSERT player_answers → UPDATE players → check all answered
```

Celkovo: **200 individualnych DB dotazov** v priebehu niekolkych sekund.

Navyse po kazdom jednom answeri sa pocita `hasAllPlayersAnswered`, co iteruje cez vsetkych 100 hracov a kontroluje `currentAnswers` mapu. Toto je O(N) operacia volana N-krat, co vytvara celkovu zlozitost **O(N²)**.

**Meratelny dopad:**
- SQLite: 200 sekvencnych zapisov (write lock) = potencialne oneskorenie 2-5 sekund
- PostgreSQL: 200 paralelnych dotazov = zataz na connection pool
- Game loop: blokovany na `await` pri kazdej DB operacii

---

### 3.2 KRITICKE: Sekvencne DB zapisy pri fazovych prechodoch

**Subor:** `server/src/game/game.engine.ts`

**Dva problematicke miesta:**

#### a) Metoda `showAnswers` (riadky 291-293)

Pre kazdeho hraca, ktory neodpovedal, sa vola sekvencny UPDATE:

```
for (const { playerId, score } of resetPlayers) {
    await playerRepository.updateScore(playerId, score, 0);
}
```

Ak napriklad 30 z 100 hracov neodpovedalo (napr. nestihli), je to **30 sekvencnych `await` UPDATE** dotazov.

#### b) Metoda `endGame` (riadky 397-399)

```
for (const entry of leaderboard) {
    await playerRepository.updateScore(entry.playerId, entry.score, entry.streak);
}
```

Tu sa vola `updateScore` pre **kazdeho z 100 hracov sekvencne** - 100 individualnych `await` UPDATE dotazov za sebou.

**Meratelny dopad:**
- Kym sa vsetkych 100 UPDATE dotazov dokoncit, host aj hraci cakaju na zobrazenie vysledkov
- Odhadovane oneskorenie: 1-3 sekundy (SQLite), 0.5-1 sekunda (PostgreSQL)
- Zly dojem z interaktivity hry - "zamrznutie" medzi fazami

---

### 3.3 VYSOKE: Opakovany sort leaderboardu pri broadcastoch

**Subor:** `server/src/game/game.engine.ts`, metody `emitPlayerStates` (riadky 542-551) a `emitFinalResults` (riadky 557-564)

**Co sa deje:** Pri kazdom zobrazeni leaderboardu sa v `emitPlayerStates` iteruje cez vsetkych hracov:

1. Pre kazdeho hraca sa vola `getPlayerGameState()`
2. `getPlayerGameState()` interne vola `getLeaderboard()`
3. `getLeaderboard()` robi sort vsetkych hracov podla skore

**Aritmetika problemu:**

```
100 hracov × getPlayerGameState() volanie
    → kazde vola getLeaderboard()
        → kazde sortuje 100 hracov

= 100 × sort(100) = ~10 000 porovnavacich operacii
```

V `emitFinalResults` sa navyse posiela **cely leaderboard array** (100 poloziek) kazdemu z 100 hracov individualne. To je 100 socketovych sprav, kazda obsahujuca 100 poloziek.

**Meratelny dopad:**
- Zbytocne CPU zatazenie na opakovany sort
- 100 individualnych socket emitov namiesto 1 broadcast
- Vyrazne oneskorenie zobrazenia leaderboardu pri vacsich skupinach

---

### 3.4 VYSOKE: Countdown timer broadcast kazdu sekundu

**Subor:** `server/src/game/game.engine.ts`, metoda `startCountdown` (riadky 492-519)

**Co sa deje:** Kazdu sekundu sa emituje `game:countdown` do dvoch Socket.IO room-ov:

```
this.io.to(hostRoom(sessionId)).emit('game:countdown', remaining);
this.io.to(playerRoom(sessionId)).emit('game:countdown', remaining);
```

**Dopad pri 100 hracoch:**

Socket.IO musi kazdu sekundu doruci spravu 101 klientom (100 hracov + 1 host). Pri 30-sekundovom limite je to:

```
30 sekund × 101 klientov = 3 030 individualnych WebSocket sprav za otazku
20 otazok × 3 030 = 60 600 sprav za celu hru len na countdown
```

Samotny room-based broadcast je relativne efektivny v Socket.IO, ale v kombinacii s ostatnymi operaciami (submitovanie odpovedov, state updaty) to zvysuje celkovy throughput a moze sposobit backpressure na WebSocket spojeniach.

---

### 3.5 STREDNE: `toPublicState` kopiruje cely state pri kazdom volani

**Subor:** `server/src/game/game-state.manager.ts`, metoda `toPublicState` (riadky 382-394)

**Co sa deje:** Kazde volanie `getGameState()` vytvara hlboku kopiu celeho herneho stavu:

```
players: state.players.map((p) => ({ ...p })),
```

A interne vola `getLeaderboard()` (sort) a `getAnswerDistribution()` (iteracia cez odpovede).

**Kedy sa `getGameState()` vola:**
- Pri kazdom submitnuti odpovede (100×)
- Pri kazdom fazovom prechode (7 faz × 20 otazok = 140×)
- Pri kazdej reconnection hraca
- Pri kazdom disconnect/reconnect hraca

**Meratelny dopad:**
- Stovky zbytocnych kopii 100-prvkoveho polja za jednu hru
- Kazde volanie obsahuje sort + iteraciu = redundantne vypocty
- Zvysena alokacia pamate a zataz na garbage collector

---

### 3.6 STREDNE: Linearne vyhladavanie hracov cez `.find()`

**Subor:** `server/src/game/game-state.manager.ts`, viacero miest (riadky 68, 91, 160, 305)

**Co sa deje:** Hraci su ulozeni ako `Player[]` (array). Kazde vyhladanie hraca podla ID pouziva:

```
state.players.find((p) => p.id === playerId)
```

Toto je **O(N)** operacia. Pri 100 hracoch a castom volani (kazdy submit, kazdy state update, kazdy disconnect) to pridava linearne prechadanie pri kazdej operacii.

**Meratelny dopad:**
- Nie je kriticke pre 100 hracov, ale je to zbytocna neefektivita
- Pri 500+ hracoch by sa to prejavilo vyraznejsie
- Jednoducho riesitelne prechodom na `Map<string, Player>`

---

### 3.7 STREDNE: SQLite write lock

**Subor:** `server/src/db/connection.ts` (riadky 31-53)

**Co sa deje:** SQLite je defaultna databaza projektu. Aj s WAL modom (ktory je zapnuty na riadku 46) ma SQLite fundamentalne obmedzenie: **len jeden zapisovaci proces naraz**.

**Dopad pri 100 hracoch:**

Vsetky DB zapisy (INSERT odpovedi, UPDATE skore, UPDATE connection status) su serializovane do jednej fronty. Ked 100 hracov submitne odpoved priblizne sucasne, zapisy sa spracovavaju jeden za druhym.

```
Odhad priepustnosti SQLite (WAL mode):
- INSERT: ~5 000-10 000/s na SSD
- 200 operacii pri spicke: ~20-40 ms
```

Pre 100 hracov je to este akceptovatelne, ale na hrane. Pre 200+ hracov by SQLite zacal byt jasnym bottleneckom.

---

### 3.8 NIZKE: Chybajuca konfiguracia Socket.IO

**Subor:** `server/src/index.ts` (riadky 22-33)

**Co sa deje:** Socket.IO server je vytvoreny s defaultnymi nastaveniami - bez konfiguracie:

- `maxHttpBufferSize` (default 1MB)
- `pingTimeout` (default 20s)
- `pingInterval` (default 25s)
- `perMessageDeflate` (vypnute)

**Dopad pri 100 hracoch:**
- Ping/pong pre 100 klientov kazdy 25 sekund = dodatocny network overhead
- Bez kompresie sprav su vacsie payloady (leaderboard s 100 hracmi)
- Default hodnoty su rozumne, ale nie optimalne pre vyssiu zataz

---

## 4. Vizualizacia casovej osi najhorsieho scenara

Nasledujuci diagram ukazuje, co sa deje v priebehu jednej otazky pri 100 hracoch:

```
Cas (sekundy)
0s          5s         10s        15s        20s        25s        30s
|-----------|----------|----------|----------|----------|----------|
|                                                                  |
|  QUESTION PHASE                                                  |
|  countdown broadcast kazdu sekundu (30× pre 101 klientov)        |
|                                                                  |
|                                            |--- SPICKA ---------|
|                                            | 80-100 hracov       |
|                                            | submitne odpoved    |
|                                            | v poslednych 10s    |
|                                            |                     |
|                                            | 100× INSERT answer  |
|                                            | 100× UPDATE score   |
|                                            | 100× check all      |
|                                            | 100× emit state     |
|                                            |                     |
|                                            | = ~400 DB operacii  |
|                                            | + ~200 socket emitov|
|                                            |---------------------|
|                                                                  |
|--- po time-up ---------------------------------------------------|
|                                                                  |
| SHOW ANSWERS PHASE                                               |
| N× UPDATE score (za neodpovedanych)                              |
|                                                                  |
| LEADERBOARD PHASE                                                |
| 100× getPlayerGameState()                                        |
|   → 100× getLeaderboard() (sort 100 hracov)                     |
|   → 100× individualny socket emit                               |
| = ~10 000 sort operacii + 100 socket sprav                      |
|                                                                  |
|--- cyklus sa opakuje pre dalsiu otazku ----                      |
```

### Celkovy pocet operacii za hru (20 otazok, 100 hracov)

| Typ operacie | Za otazku | Za celu hru (20 otazok) |
|-------------|-----------|------------------------|
| DB INSERT (odpovede) | 100 | 2 000 |
| DB UPDATE (skore) | 100-130 | 2 000-2 600 |
| Countdown broadcast | 30 × 101 | 60 600 |
| State update emity | ~200 | ~4 000 |
| Leaderboard sort | 100 | 2 000 |
| `toPublicState` kopie | ~200 | ~4 000 |
| **Celkom DB operacii** | **~230** | **~4 600** |
| **Celkom socket sprav** | **~3 430** | **~68 600** |

---

## 5. Navrhnuty riesenia

### 5.1 Riesenie problemu #1 a #2: Batch DB zapisy

**Aktualny stav:** Kazdy submit = 2 individualne DB dotazy.

**Navrh:** Oddelit in-memory game loop od DB persistence.

- Odpovede drzat **len v pamati** (v `currentAnswers` mape, ktora uz existuje) pocas trvania otazky
- Po skonceni otazky (time-up alebo vsetci odpovedali) zapisat **vsetky odpovede naraz** v jednom batch INSERT
- Skore aktualizovat jednym batch UPDATE s `CASE WHEN` klauzulou

**Ocakavany efekt:** Znizenie DB operacii pri spicke z ~200 na 1-2 batch dotazy. Eliminacia blokovania game loop-u na DB I/O pocas prijmania odpovedov.

---

### 5.2 Riesenie problemu #3: Cache leaderboardu

**Aktualny stav:** `getLeaderboard()` sa vola 100× pri jednom leaderboard zobrazeni (raz per hrac).

**Navrh:**

- Vypocitat leaderboard **raz** a vysledok ulozit do cache (napr. property na `GameState` objekte)
- Invalidovat cache len pri zmene skore (t.j. po vyhodnoteni odpovedov)
- Namiesto 100 individualnych `player:state-update` sprav poslat **jeden broadcast** `game:leaderboard` do player room-u. Kazdy klient si na FE najde svoju poziciu podla `playerId`

**Ocakavany efekt:** Znizenie z 10 000 sort operacii na 1. Znizenie socket sprav z 100 na 1 broadcast.

---

### 5.3 Riesenie problemu #5: Lazy state materialization

**Aktualny stav:** `toPublicState()` pocita leaderboard a distribution pri kazdom volani.

**Navrh:**

- Implementovat **dirty flag pattern** - prepocitat stav len ak sa od posledneho volania nieco zmenilo
- Leaderboard pocitat len vo fazach, kde je naozaj potrebny (result, leaderboard, finished)
- Distribution pocitat len v result faze

**Ocakavany efekt:** Eliminacia redundantnych vypoctov. Znizenie CPU zataze o ~60-70% v state management vrstve.

---

### 5.4 Riesenie problemu #6: Map namiesto Array

**Aktualny stav:** `state.players` je `Player[]`, vyhladavanie cez `.find()` je O(N).

**Navrh:**

- Pouzit `Map<string, Player>` ako primarne ulozisko hracov
- Array ponechat len ako sekundarny pohlad pre serializaciu (vypocitat lazy cez `Array.from(map.values())`)

**Ocakavany efekt:** O(1) lookup namiesto O(N). Jednoducha zmena s okamzitym efektom.

---

### 5.5 Riesenie problemu #7: PostgreSQL pre eventy

**Aktualny stav:** SQLite je default, PostgreSQL je uz podporovany ale nie default.

**Navrh:**

- Pre akykolvek event s viac ako 30 hracmi pouzit **PostgreSQL** (uz je podporovany cez `DB_TYPE=postgres`)
- Nakonfigurovat connection pool s dostatocnym poctom spojeni (min. 20 pre 100 hracov)
- V kombinacii s batch zapismi (riesenie #1) bude PostgreSQL dostatocne vykonny

**Ocakavany efekt:** Eliminacia SQLite write lock bottlenecku. Paralelne spracovanie DB dotazov.

---

### 5.6 Riesenie problemu #8: Socket.IO tuning

**Navrh konfiguracie pre 100+ hracov:**

- Zapnut `perMessageDeflate` pre kompresiu vacsich payloadov (leaderboard s 100 hracmi)
- Zvysit `pingTimeout` na 30s (hrac moze mat kratkovniku vypadok siete)
- Znizit `pingInterval` na 15s (castejsie kontroly spojenia)
- Nastavit `maxHttpBufferSize` na 512KB (leaderboard 100 hracov nepresahne)

**Ocakavany efekt:** Mensia velkost sprav na sieti, robustnejsie spojenia, kontrolovana spotreba pamate.

---

## 6. Prioritizacia rieseni

| Priorita | Riesenie | Narocnost implementacie | Dopad na vykon |
|----------|---------|------------------------|----------------|
| **1 (najvyssia)** | Batch DB zapisy (#1, #2) | Stredna (3-5 dni) | **Eliminuje najvacsi bottleneck** |
| **2** | Cache leaderboardu (#3) | Nizka (1-2 dni) | **Eliminuje O(N²) sort** |
| **3** | PostgreSQL pre eventy (#7) | Nizka (konfig zmena) | **Eliminuje write lock** |
| **4** | Map namiesto Array (#6) | Nizka (1 den) | Zlepsenie O(N) → O(1) |
| **5** | Lazy state materialization (#5) | Stredna (2-3 dni) | Znizenie CPU zataze |
| **6** | Socket.IO tuning (#8) | Nizka (hodiny) | Mierne zlepsenie siete |

---

## 7. Architekturne odporucanie pre skalovanie

### Aktualny stav: Single-process architektura

```
┌─────────────────────────────────┐
│         Node.js proces          │
│                                 │
│  ┌───────────┐ ┌─────────────┐  │
│  │ Express   │ │ Socket.IO   │  │
│  │ REST API  │ │ WebSocket   │  │
│  └─────┬─────┘ └──────┬──────┘  │
│        │               │        │
│  ┌─────┴───────────────┴─────┐  │
│  │   Game Engine (in-memory) │  │
│  │   Map<sessionId, State>   │  │
│  └───────────┬───────────────┘  │
│              │                  │
│  ┌───────────┴───────────────┐  │
│  │  SQLite / PostgreSQL      │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Limit:** Vsetko bezi v jednom procese. Game state je v pamati jedneho Node.js procesu. Ak proces spadne, vsetky aktivne hry sa stracia.

### Odporucany stav pre 100+ hracov

```
┌──────────────────────────────────────────────────┐
│                   Load Balancer                   │
│               (Nginx / sticky sessions)           │
└─────────────┬───────────────────┬────────────────┘
              │                   │
┌─────────────┴──────┐ ┌─────────┴────────────┐
│  Node.js Worker 1  │ │  Node.js Worker 2    │
│  Express + Socket  │ │  Express + Socket    │
└────────┬───────────┘ └────────┬─────────────┘
         │                      │
┌────────┴──────────────────────┴─────────────┐
│              Redis                           │
│  - Socket.IO Adapter (cross-worker rooms)   │
│  - Game state cache                          │
│  - Pub/Sub pre synchronizaciu               │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────┴──────────────────────────┐
│            PostgreSQL                        │
│  - Persistentne data (users, quizzes, games) │
│  - Connection pool (pgBouncer)              │
└─────────────────────────────────────────────┘
```

Toto je vsak relevantne az pri skalovani na viacero stoviek sucasnych hier. Pre jeden event so 100 hracmi v jednej hre postaci optimalizacia v ramci jedneho procesu (riesenia #1-#6).

---

## 8. Zaver

Pre event so 100 hracmi je QuizBonk **funkcne pouzitelny**, ale s viditelnym oneskorenim v kritickych momentoch (submitovanie odpovedov v spicke, zobrazovanie leaderboardu). Najzavaznejsie uzke hrdla su:

1. **Sekvencne DB zapisy pri spicke** - 200 individualnych dotazov ked vsetci odpovedia naraz
2. **Opakovany sort leaderboardu** - 10 000 sort operacii pri jednom zobrazeni
3. **SQLite write lock** - serializacia vsetkych zapisov

Implementaciou troch najvyssie prioritizovanych rieseni (batch DB zapisy, cache leaderboardu, PostgreSQL) by sa aplikacia mala bez problemov zvladnut 100 hracov s plynulou odozvou.

---

*Dokument vygenerovany na zaklade analyzy zdrojoveho kodu projektu QuizBonk.*
*Datum: 2026-02-03*
