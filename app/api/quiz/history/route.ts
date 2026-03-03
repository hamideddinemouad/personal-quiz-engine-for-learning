import { normalizeQuizSubject, parseJsonQuizPayload } from '@/server/history/quiz-json';
import { createDailyQuizByCopy, createDailyQuizByJson, getDailyQuizHistory } from '@/server/history/service';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CreateHistoryRequestBody {
  date?: unknown;
  sourceDate?: unknown;
  questions?: unknown;
  subject?: unknown;
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
  try {
    const history = await getDailyQuizHistory();
    logInfo('api.history.get.success', { rowCount: history.length });
    return Response.json({ history });
  } catch (error) {
    logError('api.history.get.failed', error);
    return Response.json({ error: 'Unable to load quiz history.' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as CreateHistoryRequestBody;
    if (!isValidDateKey(body.date)) {
      return Response.json(
        { error: 'Body must include valid `date` in YYYY-MM-DD format.' },
        { status: 400 }
      );
    }

    if (typeof body.questions !== 'undefined') {
      const parsedJsonQuiz = parseJsonQuizPayload(body.questions);
      if (parsedJsonQuiz.error) {
        return Response.json({ error: parsedJsonQuiz.error }, { status: 400 });
      }

      const resolvedSubject = normalizeQuizSubject(body.subject) || parsedJsonQuiz.subject;
      const result = await createDailyQuizByJson(
        body.date,
        parsedJsonQuiz.questions,
        resolvedSubject
      );

      if (result.kind === 'date_conflict') {
        logInfo('api.history.post.date_conflict', {
          date: body.date,
          createMode: 'json'
        });
        return Response.json({ error: 'Target date already exists.' }, { status: 409 });
      }

      logInfo('api.history.post.success', {
        date: result.entry.date,
        createMode: 'json',
        questionCount: result.entry.questions.length
      });
      return Response.json({ entry: result.entry }, { status: 201 });
    }

    if (isValidDateKey(body.sourceDate)) {
      const result = await createDailyQuizByCopy(body.date, body.sourceDate);

      if (result.kind === 'source_not_found') {
        logInfo('api.history.post.source_not_found', {
          date: body.date,
          sourceDate: body.sourceDate
        });
        return Response.json({ error: 'Source date was not found in history.' }, { status: 404 });
      }

      if (result.kind === 'date_conflict') {
        logInfo('api.history.post.date_conflict', {
          date: body.date,
          sourceDate: body.sourceDate,
          createMode: 'copy'
        });
        return Response.json({ error: 'Target date already exists.' }, { status: 409 });
      }

      logInfo('api.history.post.success', {
        date: result.entry.date,
        sourceDate: body.sourceDate,
        createMode: 'copy'
      });
      return Response.json({ entry: result.entry }, { status: 201 });
    }

    return Response.json(
      { error: 'Body must include either valid `sourceDate` or `questions` payload.' },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    logError('api.history.post.failed', error);
    return Response.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
