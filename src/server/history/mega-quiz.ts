import { cloneQuestion, shuffleArray } from '@/lib/quiz-transform';
import type { DailyQuizHistoryEntry, QuizQuestion } from '@/types/quiz';

const DEFAULT_TOTAL_QUESTIONS = 20;

interface BuildShuffledMegaQuizOptions {
  excludeDate?: string;
  totalQuestions?: number;
}

// Goal: Give each reused question a unique id so React keys and answer maps stay collision-free.
function withMegaId(question: QuizQuestion, sourceDate: string, token: string): QuizQuestion {
  return {
    ...cloneQuestion(question),
    id: `mega-${sourceDate}-${question.id}-${token}`
  };
}

function normalizeForFingerprint(value: string | undefined): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizedOptionTexts(options: QuizQuestion['options'] | undefined): string[] {
  if (!Array.isArray(options)) {
    return [];
  }

  // We sort so "same options, different order" still hashes as the same question.
  return options
    .map((option) => normalizeForFingerprint(option.text))
    .filter(Boolean)
    .sort();
}

function normalizedWhyOptionTexts(options: QuizQuestion['whyOptions'] | undefined): string[] {
  if (!Array.isArray(options)) {
    return [];
  }

  // Why choices can also be shuffled in sessions, so order should not define uniqueness.
  return options
    .map((option) => normalizeForFingerprint(option.text))
    .filter(Boolean)
    .sort();
}

function getQuestionFingerprint(question: QuizQuestion): string {
  // Intentionally ignores `id` because the same logical question may be stored with different ids.
  const questionText = normalizeForFingerprint(question.question);
  const whyQuestionText = normalizeForFingerprint(question.whyQuestion);
  const optionTexts = normalizedOptionTexts(question.options).join('|');
  const whyOptionTexts = normalizedWhyOptionTexts(question.whyOptions).join('|');

  return [questionText, whyQuestionText, optionTexts, whyOptionTexts].join('::');
}

export function buildShuffledMegaQuizFromHistory(
  entries: DailyQuizHistoryEntry[],
  options: BuildShuffledMegaQuizOptions = {}
): QuizQuestion[] {
  const totalQuestions = options.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;

  if (totalQuestions <= 0) {
    return [];
  }

  // Step 1: Keep only valid source days and optionally exclude one date.
  const eligibleEntries = entries.filter(
    (entry) => entry.date !== options.excludeDate && entry.questions.length > 0
  );

  if (eligibleEntries.length === 0) {
    return [];
  }

  // Step 2: Build a global unique pool across every quiz entry.
  const seenFingerprints = new Set<string>();
  const uniquePool: Array<{ sourceDate: string; question: QuizQuestion }> = [];

  eligibleEntries.forEach((entry) => {
    entry.questions.forEach((question) => {
      const fingerprint = getQuestionFingerprint(question);
      if (!fingerprint || seenFingerprints.has(fingerprint)) {
        // Keep first seen copy only; later duplicates are dropped from shuffle pool.
        return;
      }

      seenFingerprints.add(fingerprint);
      uniquePool.push({
        sourceDate: entry.date,
        question
      });
    });
  });

  if (uniquePool.length === 0) {
    return [];
  }

  // Step 3: Sample up to N unique questions randomly from the global pool.
  const sampledQuestions = shuffleArray(uniquePool).slice(0, totalQuestions);

  return sampledQuestions.map((item, index) => {
    const token = `u${index + 1}`;
    return withMegaId(item.question, item.sourceDate, token);
  });
}
