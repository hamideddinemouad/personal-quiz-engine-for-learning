# Personal Quiz Engine (Next.js + TypeScript)

A daily quiz app with server-side history APIs backed by Postgres (works with local Docker Postgres and Neon).

## Prerequisites

- Node.js 20+
- npm
- Docker Desktop (or Docker Engine)

## Quick Start (Local)

1. Install dependencies:

```bash
npm install
```

2. Start local Postgres container:

```bash

docker run --name quiz-pg \
  -e POSTGRES_USER=quiz \
  -e POSTGRES_PASSWORD=quizpass \
  -e POSTGRES_DB=quizdb \
  -p 5433:5432 \
  -v quiz_pg_data:/var/lib/postgresql/data \
  -d postgres:16
```

3. Create `.env.local`:

```env
DATABASE_URL=postgresql://quiz:quizpass@localhost:5433/quizdb
QUIZ_LOG_LEVEL=debug
```

4. Run app:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
http://localhost:3000/flash
```

## Local Testing Checklist

1. Go to `/flash`.
2. Create a quiz of the day from JSON or using your existing flow.
3. Refresh the page and confirm the quiz is loaded directly (no setup prompt).
4. Restart app server (`Ctrl+C`, then `npm run dev`) and confirm data still exists.
5. Verify directly in Postgres:

```bash
docker exec -it quiz-pg psql -U quiz -d quizdb -c "SELECT date, subject, saved_at FROM daily_quiz_history ORDER BY date DESC;"
```

## Docker Container Management

Start existing container:

```bash
docker start quiz-pg
```

Stop container:

```bash
docker stop quiz-pg
```

View logs:

```bash
docker logs -f quiz-pg
```

Delete container (keeps volume data):

```bash
docker rm quiz-pg
```

Delete container and volume data (destructive):

```bash
docker rm -f quiz-pg
docker volume rm quiz_pg_data
```

## Environment Variables

- `DATABASE_URL` (required): Postgres connection string.
- `QUIZ_LOG_LEVEL` (optional): `debug`, `info`, or `error`.
- `CRON_SECRET` (required for scheduled backups): shared secret used by Vercel Cron auth.
- `BACKUP_GITHUB_TOKEN` (required for scheduled backups): fine-grained GitHub token.
- `BACKUP_GITHUB_OWNER` (required for scheduled backups): target repo owner.
- `BACKUP_GITHUB_REPO` (required for scheduled backups): target repo name.
- `BACKUP_GITHUB_BRANCH` (optional): defaults to `main`.
- `BACKUP_GITHUB_DIR` (optional): defaults to `quiz-backups`.

## Build / Production Check

```bash
npm run typecheck
npm run build
```

## Neon + Vercel Deployment

1. Create a Neon project and copy its connection string.
2. In Vercel project settings, add:
   - `DATABASE_URL`
   - `QUIZ_LOG_LEVEL=info` (optional)
   - `CRON_SECRET`
   - `BACKUP_GITHUB_TOKEN`
   - `BACKUP_GITHUB_OWNER`
   - `BACKUP_GITHUB_REPO`
   - `BACKUP_GITHUB_BRANCH=main` (optional)
   - `BACKUP_GITHUB_DIR=quiz-backups` (optional)
3. Deploy.

The app initializes the `daily_quiz_history` table automatically on first request.

## Free GitHub Backups (Every 2 Days)

This project includes a scheduled backup endpoint:

- `GET /api/backup/github`
- protected by `CRON_SECRET`
- scheduled by `vercel.json` with `0 3 */2 * *` (every 2nd day at 03:00 UTC)

Each run exports full `daily_quiz_history` data from Postgres and commits a JSON snapshot to your GitHub repo under:

- `quiz-backups/YYYY/MM/DD/quiz-history-<timestamp>.json` (or your `BACKUP_GITHUB_DIR`)

### GitHub Setup Checklist

1. Create a private repo dedicated to backups (for example: `quiz-history-backups`).
2. Create a Fine-grained Personal Access Token:
   - Resource owner: your account/org.
   - Repository access: only the backup repo.
   - Permission: `Contents` -> `Read and write`.
3. Copy the token into Vercel env var `BACKUP_GITHUB_TOKEN`.
4. Set `BACKUP_GITHUB_OWNER` and `BACKUP_GITHUB_REPO` to that repo.
5. Redeploy after setting env vars.

### Manual Verification

Run this once (replace placeholders):

```bash
curl -i -H "Authorization: Bearer <CRON_SECRET>" https://<your-domain>/api/backup/github
```

You should receive `200` and see a new JSON file committed in your backup repo.

## Debugging Logs

Server logs are JSON lines; filter by `event`.

Common events:

- `db.pool.initialized`
- `db.schema.ready`
- `api.today.post.success`
- `history.upsert.success`
- `api.backup.github.success`
- `db.schema.failed`

## Seed Past-Day History

```bash
npm run seed:shuffle-mega
```

Optional flags:

- `--days 21`
- `--from 2026-03-01`
- `--source-date 2026-02-28`
- `--overwrite`

Example:

```bash
npm run seed:shuffle-mega -- --days 21 --from 2026-03-01 --overwrite
```
