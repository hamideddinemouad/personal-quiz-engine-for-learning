# Personal Quiz Engine (Next.js + TypeScript)

A daily quiz app with server-side history APIs and SQLite storage.

## Features

- Two-step flow per question (`main` then `why`)
- Retry on incorrect answers
- Locking after correct answers
- Daily quiz snapshots with subject labels
- History CRUD modal (create/read/update/delete by date)
- Shuffle Mega Quiz from past snapshots

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Build

```bash
npm run build
npm start
```

## Vercel deployment (Free tier)

### What is configured in this repo

- Next.js App Router project (Vercel auto-detects it)
- API routes are forced to Node runtime (`runtime = 'nodejs'`)
- On Vercel, SQLite automatically uses `/tmp/quiz-history.sqlite`

### Deploy steps

1. Push this repo to GitHub/GitLab/Bitbucket.
2. Import the repo in Vercel.
3. Keep defaults (`Framework Preset: Next.js`, `Build Command: npm run build`).
4. Deploy.

### Optional environment variables

- `QUIZ_DB_PATH`: custom sqlite file path (absolute or relative). If omitted, Vercel defaults to `/tmp/quiz-history.sqlite`.

## Important storage note for Vercel Free tier

Vercel serverless filesystem storage is ephemeral. That means quiz history stored in SQLite can reset when instances restart or scale.

If you need durable, cross-instance history, move storage to a managed database (for example Vercel Postgres or KV) and keep this SQLite path for local development only.

## Seed past-day history (local)

```bash
npm run seed:shuffle-mega
```

Optional flags:

- `--days 21`
- `--from 2026-03-01`
- `--overwrite`

Example:

```bash
npm run seed:shuffle-mega -- --days 21 --from 2026-03-01 --overwrite
```
