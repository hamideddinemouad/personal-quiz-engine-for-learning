import type { QuizOption, QuizQuestion } from '@/types/quiz';

export function normalizeQuizSubject(value: unknown): string | null {
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

export function parseJsonQuizQuestions(value: unknown): { questions: QuizQuestion[]; error: string | null } {
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
