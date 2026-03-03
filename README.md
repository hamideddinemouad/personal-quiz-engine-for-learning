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
3. Deploy.

The app initializes the `daily_quiz_history` table automatically on first request.

## Debugging Logs

Server logs are JSON lines; filter by `event`.

Common events:

- `db.pool.initialized`
- `db.schema.ready`
- `api.today.post.success`
- `history.upsert.success`
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
