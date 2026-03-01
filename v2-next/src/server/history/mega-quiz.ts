import { cloneQuestion, shuffleArray } from '@/lib/quiz-transform';
import type { DailyQuizHistoryEntry, QuizQuestion } from '@/types/quiz';

const DEFAULT_QUESTIONS_PER_QUIZ = 5;
const DEFAULT_TOTAL_QUESTIONS = 35;

interface BuildShuffledMegaQuizOptions {
  excludeDate?: string;
  questionsPerQuiz?: number;
  totalQuestions?: number;
}

function withMegaId(question: QuizQuestion, sourceDate: string, token: string): QuizQuestion {
  return {
    ...cloneQuestion(question),
    id: `mega-${sourceDate}-${question.id}-${token}`
  };
}

function pickQuizGroups(
  entries: DailyQuizHistoryEntry[],
  totalQuestions: number,
  questionsPerQuiz: number
): DailyQuizHistoryEntry[] {
  const quizzesNeeded = Math.max(1, Math.ceil(totalQuestions / questionsPerQuiz));
  const shuffledEntries = shuffleArray(entries);
  const groups: DailyQuizHistoryEntry[] = [];

  let index = 0;
  while (groups.length < quizzesNeeded) {
    if (index >= shuffledEntries.length) {
      index = 0;
    }

    groups.push(shuffledEntries[index]);
    index += 1;
  }

  return groups;
}

export function buildShuffledMegaQuizFromHistory(
  entries: DailyQuizHistoryEntry[],
  options: BuildShuffledMegaQuizOptions = {}
): QuizQuestion[] {
  const questionsPerQuiz = options.questionsPerQuiz ?? DEFAULT_QUESTIONS_PER_QUIZ;
  const totalQuestions = options.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;

  if (questionsPerQuiz <= 0 || totalQuestions <= 0) {
    return [];
  }

  const eligibleEntries = entries.filter(
    (entry) => entry.date !== options.excludeDate && entry.questions.length > 0
  );

  if (eligibleEntries.length === 0) {
    return [];
  }

  const groups = pickQuizGroups(eligibleEntries, totalQuestions, questionsPerQuiz);
  const selectedQuestions: QuizQuestion[] = [];

  groups.forEach((entry, groupIndex) => {
    const shuffledQuestions = shuffleArray(entry.questions);
    const count = Math.min(questionsPerQuiz, shuffledQuestions.length);

    for (let index = 0; index < count; index += 1) {
      const token = `g${groupIndex + 1}-q${index + 1}-${selectedQuestions.length + 1}`;
      selectedQuestions.push(withMegaId(shuffledQuestions[index], entry.date, token));
    }
  });

  if (selectedQuestions.length < totalQuestions) {
    const fallbackPool = shuffleArray(
      eligibleEntries.flatMap((entry) =>
        entry.questions.map((question, index) => ({
          sourceDate: entry.date,
          question,
          index
        }))
      )
    );

    if (fallbackPool.length > 0) {
      let cursor = 0;
      while (selectedQuestions.length < totalQuestions) {
        const source = fallbackPool[cursor % fallbackPool.length];
        const token = `f${cursor + 1}-${selectedQuestions.length + 1}-${source.index + 1}`;
        selectedQuestions.push(withMegaId(source.question, source.sourceDate, token));
        cursor += 1;
      }
    }
  }

  return shuffleArray(selectedQuestions).slice(0, totalQuestions);
}
