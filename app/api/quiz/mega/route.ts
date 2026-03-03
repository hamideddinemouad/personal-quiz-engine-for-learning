import { buildMegaQuizFromDates, buildShuffledMegaQuizFromPast } from '@/server/history/service';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MegaQuizRequestBody {
  mode?: unknown;
  dates?: unknown;
}

function isValidDateArray(value: unknown): value is string[] {
  // Goal: Narrow unknown request payload into a safe list of date keys.
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

export async function POST(request: Request): Promise<Response> {
  // Goal: Support two mega quiz modes from one endpoint:
  // 1) mode: "shuffle" => random 20-question mega quiz from all history
  // 2) dates: string[] => deterministic mega quiz from explicit dates
  try {
    const body = (await request.json()) as MegaQuizRequestBody;

    if (body.mode === 'shuffle') {
      const questions = await buildShuffledMegaQuizFromPast();

      if (questions.length === 0) {
        logInfo('api.mega.post.empty_shuffle', { mode: body.mode });
        return Response.json(
          { error: 'No past quiz history found. Complete quizzes on previous days first.' },
          { status: 400 }
        );
      }

      logInfo('api.mega.post.success', {
        mode: body.mode,
        questionCount: questions.length
      });
      return Response.json({ questions });
    }

    if (!isValidDateArray(body.dates)) {
      return Response.json(
        { error: 'Request body must include `mode: \"shuffle\"` or a `dates` array.' },
        { status: 400 }
      );
    }

    const questions = await buildMegaQuizFromDates(body.dates);
    logInfo('api.mega.post.success', {
      mode: 'dates',
      dateCount: body.dates.length,
      questionCount: questions.length
    });
    return Response.json({ questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    logError('api.mega.post.failed', error);
    return Response.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
