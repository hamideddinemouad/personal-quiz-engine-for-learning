# Personal Quiz Engine (Next.js + TypeScript)

This is a Next.js App Router rewrite of `v1` with the same quiz behavior, but with SQLite persistence replacing `localStorage` for daily quiz history.

## What matches `v1`

- Two-step flow per question (`main` then `why`)
- Retry on incorrect answers
- Locking after correct answers
- Status derivation:
  - `UNATTEMPTED`
  - `PARTIAL`
  - `MASTERED`
- Sidebar navigation + stopwatch
- Question choice shuffling on each page load

## Mega Quiz Button

- A `Shuffle Mega Quiz` button is available in the quiz header.
- It loads a brand-new session in-place (no full page reload).
- The mega quiz is built from past history as:
  - 5 random questions per quiz snapshot
  - total 35 questions
- If no past days exist yet, the button shows an error and keeps the current quiz.

## Key difference

`v1` saved daily snapshots in browser `localStorage`.

This version writes them to SQLite (`data/quiz-history.sqlite`) with the same behavior:
- On page load, app reads today’s quiz from DB only
- If today is missing, user chooses either:
  - `Load Latest Quiz` (copy latest past day into today)
  - `Shuffle Mega Quiz` (build from past history and save as today)
  - `Use JSON Quiz As Today` (paste JSON + optional subject, then save as today)
- Each daily row also stores a `subject` label for quick reference
- History is capped to 365 days

## Project structure

```text
app/
  api/quiz/history/route.ts           # list all daily snapshots
  api/quiz/history/[date]/route.ts    # get one date snapshot
  api/quiz/mega/route.ts              # build mega quiz from selected dates
  api/quiz/today/route.ts             # create/read today's quiz snapshot
  layout.tsx
  page.tsx                            # renders quiz from today's DB snapshot

src/
  constants/quiz-status.ts
  types/quiz.ts
  lib/
    quiz-transform.ts                 # shuffle + clone helpers
    quiz-status.ts                    # status and initial answer helpers
    date.ts                           # YYYY-MM-DD local key
  features/quiz/
    context/quiz-context.tsx          # client quiz runtime state/actions
    components/                       # split UI components
  server/
    db/client.ts                      # sqlite connection + schema init
    history/repository.ts             # data access layer
    history/service.ts                # app-level history service
```

## Run

```bash
cd v2-next
npm install
npm run dev
```

Open `http://localhost:3000`.

## Seed past-day history (for Shuffle Mega Quiz testing)

If you only have today in history, generate realistic snapshots for previous days:

```bash
cd v2-next
npm run seed:shuffle-mega
```

Optional flags:
- `--days 21` to seed a different number of past days (default: `14`)
- `--from 2026-03-01` to pick the reference day (seeds days before this date)
- `--overwrite` to replace already existing past-day rows

Example:

```bash
npm run seed:shuffle-mega -- --days 21 --from 2026-03-01 --overwrite
```

## API quick usage

### List history

```bash
curl http://localhost:3000/api/quiz/history
```

### Get one day

```bash
curl http://localhost:3000/api/quiz/history/2026-03-01
```

### Build mega quiz from days

```bash
curl -X POST http://localhost:3000/api/quiz/mega \
  -H "content-type: application/json" \
  -d '{"dates":["2026-02-27","2026-02-28","2026-03-01"]}'
```
