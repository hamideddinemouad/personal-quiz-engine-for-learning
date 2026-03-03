import {
  createTodayQuizFromJson,
  createTodayQuizFromLatestHistory,
  createTodayQuizFromShuffledMegaQuiz,
  getTodayQuizSnapshot
} from '@/server/history/service';
import { logError, logInfo } from '@/server/logging';
import type { QuizOption, QuizQuestion } from '@/types/quiz';

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

function normalizeSubject(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toQuizOption(rawOption: unknown, questionIndex: number, optionIndex: number): QuizOption | null {
  if (!rawOption || typeof rawOption !== 'object') {
    return null;
  }

  const optionRecord = rawOption as Record<string, unknown>;
  const text = typeof optionRecord.text === 'string' ? optionRecord.text.trim() : '';
  const feedback = typeof optionRecord.feedback === 'string' ? optionRecord.feedback.trim() : '';
  if (!text || typeof optionRecord.isCorrect !== 'boolean') {
    return null;
  }

  return {
    text,
    isCorrect: optionRecord.isCorrect,
    feedback: feedback || `Feedback missing for question ${questionIndex + 1}, option ${optionIndex + 1}.`
  };
}

function parseQuestionOptions(rawOptions: unknown, questionIndex: number): QuizOption[] | null {
  if (!Array.isArray(rawOptions) || rawOptions.length === 0) {
    return null;
  }

  const parsedOptions = rawOptions
    .map((option, optionIndex) => toQuizOption(option, questionIndex, optionIndex))
    .filter((option): option is QuizOption => Boolean(option));

  if (parsedOptions.length !== rawOptions.length) {
    return null;
  }

  if (!parsedOptions.some((option) => option.isCorrect)) {
    return null;
  }

  return parsedOptions;
}

function parseJsonQuizQuestions(value: unknown): { questions: QuizQuestion[]; error: string | null } {
  if (!Array.isArray(value) || value.length === 0) {
    return {
      questions: [],
      error: '`questions` must be a non-empty array.'
    };
  }

  const questions: QuizQuestion[] = [];

  for (let index = 0; index < value.length; index += 1) {
    const rawQuestion = value[index];
    if (!rawQuestion || typeof rawQuestion !== 'object') {
      return {
        questions: [],
        error: `Question ${index + 1} must be an object.`
      };
    }

    const questionRecord = rawQuestion as Record<string, unknown>;
    const questionText =
      typeof questionRecord.question === 'string' ? questionRecord.question.trim() : '';
    if (!questionText) {
      return {
        questions: [],
        error: `Question ${index + 1} is missing a valid "question" string.`
      };
    }

    const options = parseQuestionOptions(questionRecord.options, index);
    if (!options) {
      return {
        questions: [],
        error: `Question ${index + 1} must contain valid options with at least one correct answer.`
      };
    }

    const parsedQuestion: QuizQuestion = {
      id:
        typeof questionRecord.id === 'string' && questionRecord.id.trim()
          ? questionRecord.id.trim()
          : `json-q${index + 1}`,
      type: 'mcq',
      question: questionText,
      options,
      hint: typeof questionRecord.hint === 'string' ? questionRecord.hint.trim() : undefined,
      requiresWhy: Boolean(questionRecord.requiresWhy),
      whyQuestion: undefined,
      whyOptions: undefined
    };

    if (parsedQuestion.requiresWhy) {
      const whyQuestion =
        typeof questionRecord.whyQuestion === 'string' ? questionRecord.whyQuestion.trim() : '';
      const whyOptions = parseQuestionOptions(questionRecord.whyOptions, index);

      if (!whyQuestion || !whyOptions) {
        return {
          questions: [],
          error: `Question ${index + 1} requires valid "whyQuestion" and "whyOptions".`
        };
      }

      parsedQuestion.whyQuestion = whyQuestion;
      parsedQuestion.whyOptions = whyOptions;
    }

    questions.push(parsedQuestion);
  }

  const uniqueIds = new Set(questions.map((question) => question.id));
  if (uniqueIds.size !== questions.length) {
    return {
      questions: [],
      error: 'Question ids must be unique.'
    };
  }

  return { questions, error: null };
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

    const subject = normalizeSubject(body.subject);
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
