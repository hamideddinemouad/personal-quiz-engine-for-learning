import { deleteDailyQuizByDate, getDailyQuizByDate, renameDailyQuizDate } from '@/server/history/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: {
    date: string;
  };
}

interface RenameHistoryRequestBody {
  nextDate?: unknown;
}

function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

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

export async function GET(_request: Request, { params }: RouteContext): Promise<Response> {
  const entry = getDailyQuizByDate(params.date);

  if (!entry) {
    return Response.json({ error: 'Quiz history not found for this date.' }, { status: 404 });
  }

  return Response.json({ entry });
}

export async function PUT(request: Request, { params }: RouteContext): Promise<Response> {
  if (!isValidDateKey(params.date)) {
    return Response.json({ error: 'Invalid date parameter.' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as RenameHistoryRequestBody;
    if (!isValidDateKey(body.nextDate)) {
      return Response.json({ error: 'Body must include `nextDate` in YYYY-MM-DD format.' }, { status: 400 });
    }

    const result = renameDailyQuizDate(params.date, body.nextDate);
    if (result === 'not_found') {
      return Response.json({ error: 'Quiz history not found for this date.' }, { status: 404 });
    }

    if (result === 'conflict') {
      return Response.json({ error: 'Target date already exists.' }, { status: 409 });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext): Promise<Response> {
  if (!isValidDateKey(params.date)) {
    return Response.json({ error: 'Invalid date parameter.' }, { status: 400 });
  }

  const deleted = deleteDailyQuizByDate(params.date);
  if (!deleted) {
    return Response.json({ error: 'Quiz history not found for this date.' }, { status: 404 });
  }

  return Response.json({ success: true });
}
