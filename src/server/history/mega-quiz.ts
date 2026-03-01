import { cloneQuestion, shuffleArray } from '@/lib/quiz-transform';
import type { DailyQuizHistoryEntry, QuizQuestion } from '@/types/quiz';

// Goal: Keep mega-quiz size and day contribution explicit in one place.
const DEFAULT_QUESTIONS_PER_QUIZ = 5;
const DEFAULT_TOTAL_QUESTIONS = 35;

interface BuildShuffledMegaQuizOptions {
  excludeDate?: string;
  questionsPerQuiz?: number;
  totalQuestions?: number;
}

// Goal: Give each reused question a unique id so React keys and answer maps stay collision-free.
function withMegaId(question: QuizQuestion, sourceDate: string, token: string): QuizQuestion {
  return {
    ...cloneQuestion(question),
    id: `mega-${sourceDate}-${question.id}-${token}`
  };
}

// Goal: Pick enough source quiz days to satisfy the target question count.
// If history is small, we cycle through shuffled entries instead of failing.
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
  // Goal: Build a 35-question mega quiz from past snapshots,
  // using 5 random questions per selected day whenever possible.

  // Step 1: Resolve config with safe defaults.
  const questionsPerQuiz = options.questionsPerQuiz ?? DEFAULT_QUESTIONS_PER_QUIZ;
  const totalQuestions = options.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS;

  // Step 2: Reject invalid config early to avoid surprising partial output.
  if (questionsPerQuiz <= 0 || totalQuestions <= 0) {
    return [];
  }

  // Step 3: Keep only valid source days and optionally exclude today.
  const eligibleEntries = entries.filter(
    (entry) => entry.date !== options.excludeDate && entry.questions.length > 0
  );

  if (eligibleEntries.length === 0) {
    return [];
  }

  // Step 4: Choose day groups and pick up to N random questions from each.
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

  // Step 5: If some days had fewer than N questions, fill from all past questions.
  // We still assign unique ids because the same source question may be reused.
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

  // Step 6: Shuffle final order so questions are mixed across source days.
  return shuffleArray(selectedQuestions).slice(0, totalQuestions);
}
