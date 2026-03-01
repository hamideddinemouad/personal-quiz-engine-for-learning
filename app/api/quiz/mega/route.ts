import { buildMegaQuizFromDates, buildShuffledMegaQuizFromPast } from '@/server/history/service';

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
  // 1) mode: "shuffle" => random 35-question mega quiz from past history
  // 2) dates: string[] => deterministic mega quiz from explicit dates
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
