import {
  createTodayQuizFromJson,
  createTodayQuizFromLatestHistory,
  createTodayQuizFromShuffledMegaQuiz,
  getTodayQuizSnapshot
} from '@/server/history/service';
import { normalizeQuizSubject, parseJsonQuizQuestions } from '@/server/history/quiz-json';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TodayQuizRequestBody {
  mode?: unknown;
  subject?: unknown;
  questions?: unknown;
}

function isCreationMode(value: unknown): value is 'load' | 'shuffle' | 'json' {
  return value === 'load' || value === 'shuffle' || value === 'json';
}

export async function GET(): Promise<Response> {
  const snapshot = await getTodayQuizSnapshot();
  logInfo('api.today.get.success', {
    hasTodayQuiz: snapshot.hasTodayQuiz,
    questionCount: snapshot.questions.length
  });

  return Response.json({
    hasTodayQuiz: snapshot.hasTodayQuiz,
    subject: snapshot.subject,
    questions: snapshot.questions
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as TodayQuizRequestBody;
    if (!isCreationMode(body.mode)) {
      return Response.json(
        { error: 'Body must include mode: "load", "shuffle", or "json".' },
        { status: 400 }
      );
    }

    const subject = normalizeQuizSubject(body.subject);
    let result;

    if (body.mode === 'load') {
      result = await createTodayQuizFromLatestHistory(subject);
    } else if (body.mode === 'shuffle') {
      result = await createTodayQuizFromShuffledMegaQuiz(subject);
    } else {
      const parsedJsonQuiz = parseJsonQuizQuestions(body.questions);
      if (parsedJsonQuiz.error) {
        return Response.json({ error: parsedJsonQuiz.error }, { status: 400 });
      }

      result = await createTodayQuizFromJson(parsedJsonQuiz.questions, subject);
    }

    if (result.saveError || result.questions.length === 0) {
      logInfo('api.today.post.failed_validation', {
        mode: body.mode,
        subject,
        saveError: result.saveError,
        questionCount: result.questions.length
      });
      return Response.json(
        { error: result.saveError || 'Unable to create today quiz.' },
        { status: 400 }
      );
    }

    logInfo('api.today.post.success', {
      mode: body.mode,
      subject: result.subject,
      questionCount: result.questions.length
    });

    return Response.json({ subject: result.subject, questions: result.questions });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    logError('api.today.post.failed', error);
    return Response.json({ error: 'Unable to process request.' }, { status: 500 });
  }
}
