import { buildMegaQuizFromDates, buildShuffledMegaQuizFromPast } from '@/server/history/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MegaQuizRequestBody {
  mode?: unknown;
  dates?: unknown;
}

function isValidDateArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string' && entry.length > 0);
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as MegaQuizRequestBody;

    if (body.mode === 'shuffle') {
      const questions = buildShuffledMegaQuizFromPast();

      if (questions.length === 0) {
        return Response.json(
          { error: 'No past quiz history found. Complete quizzes on previous days first.' },
          { status: 400 }
        );
      }

      return Response.json({ questions });
    }

    if (!isValidDateArray(body.dates)) {
      return Response.json(
        { error: 'Request body must include `mode: \"shuffle\"` or a `dates` array.' },
        { status: 400 }
      );
    }

    const questions = buildMegaQuizFromDates(body.dates);
    return Response.json({ questions });
  } catch {
    return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
  }
}
