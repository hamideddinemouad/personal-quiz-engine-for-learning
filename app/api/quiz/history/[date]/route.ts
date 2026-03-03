import { deleteDailyQuizByDate, getDailyQuizByDate, renameDailyQuizDate } from '@/server/history/service';
import { logError, logInfo } from '@/server/logging';

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
  try {
    const entry = await getDailyQuizByDate(params.date);

    if (!entry) {
      logInfo('api.history_by_date.get.not_found', { date: params.date });
      return Response.json({ error: 'Quiz history not found for this date.' }, { status: 404 });
    }

    logInfo('api.history_by_date.get.success', { date: params.date });
    return Response.json({ entry });
  } catch (error) {
    logError('api.history_by_date.get.failed', error, { date: params.date });
    return Response.json({ error: 'Unable to load quiz history row.' }, { status: 500 });
  }
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

    const result = await renameDailyQuizDate(params.date, body.nextDate);
    if (result === 'not_found') {
      logInfo('api.history_by_date.put.not_found', { date: params.date, nextDate: body.nextDate });
      return Response.json({ error: 'Quiz history not found for this date.' }, { status: 404 });
    }

    if (result === 'conflict') {
      logInfo('api.history_by_date.put.conflict', { date: params.date, nextDate: body.nextDate });
      return Response.json({ error: 'Target date already exists.' }, { status: 409 });
    }

    logInfo('api.history_by_date.put.success', { date: params.date, nextDate: body.nextDate });
    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    logError('api.history_by_date.put.failed', error, { date: params.date });
    return Response.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext): Promise<Response> {
  if (!isValidDateKey(params.date)) {
    return Response.json({ error: 'Invalid date parameter.' }, { status: 400 });
  }

  try {
    const deleted = await deleteDailyQuizByDate(params.date);
    if (!deleted) {
      logInfo('api.history_by_date.delete.not_found', { date: params.date });
      return Response.json({ error: 'Quiz history not found for this date.' }, { status: 404 });
    }

    logInfo('api.history_by_date.delete.success', { date: params.date });
    return Response.json({ success: true });
  } catch (error) {
    logError('api.history_by_date.delete.failed', error, { date: params.date });
    return Response.json({ error: 'Unable to delete history row.' }, { status: 500 });
  }
}
