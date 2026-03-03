import { createDailyQuizByCopy, getDailyQuizHistory } from '@/server/history/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateHistoryRequestBody {
  date?: unknown;
  sourceDate?: unknown;
}

function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  // Goal: Reject impossible dates like 2026-02-30 in API layer.
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const parsedDate = new Date(year, monthIndex, day, 12, 0, 0, 0);

  return (
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === monthIndex &&
    parsedDate.getDate() === day
  );
}

export async function GET(): Promise<Response> {
  return Response.json({ history: getDailyQuizHistory() });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as CreateHistoryRequestBody;
    if (!isValidDateKey(body.date) || !isValidDateKey(body.sourceDate)) {
      return Response.json(
        { error: 'Body must include valid `date` and `sourceDate` in YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    const result = createDailyQuizByCopy(body.date, body.sourceDate);

    if (result.kind === 'source_not_found') {
      return Response.json({ error: 'Source date was not found in history.' }, { status: 404 });
    }

    if (result.kind === 'date_conflict') {
      return Response.json({ error: 'Target date already exists.' }, { status: 409 });
    }

    return Response.json({ entry: result.entry }, { status: 201 });
  } catch {
    return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }
}
