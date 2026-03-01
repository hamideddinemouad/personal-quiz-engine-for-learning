const DAILY_QUIZ_HISTORY_KEY = 'quiz-daily-history-v1';
const MAX_DAYS_STORED = 365;

function isBrowserStorageAvailable() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function toLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function cloneOption(option) {
  return { ...option };
}

function cloneQuestion(question) {
  return {
    ...question,
    options: Array.isArray(question.options) ? question.options.map(cloneOption) : question.options,
    whyOptions: Array.isArray(question.whyOptions)
      ? question.whyOptions.map(cloneOption)
      : question.whyOptions
  };
}

function cloneQuestions(questions) {
  if (!Array.isArray(questions)) {
    return [];
  }

  return questions.map(cloneQuestion);
}

function isHistoryEntry(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    typeof value.date === 'string' &&
    typeof value.savedAt === 'string' &&
    Array.isArray(value.questions)
  );
}

function readHistoryMap() {
  if (!isBrowserStorageAvailable()) {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(DAILY_QUIZ_HISTORY_KEY);
    if (!rawValue) {
      return {};
    }

    const parsedValue = JSON.parse(rawValue);
    if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue)) {
      return {};
    }

    return Object.entries(parsedValue).reduce((acc, [date, entry]) => {
      if (isHistoryEntry(entry) && entry.date === date) {
        acc[date] = entry;
      }
      return acc;
    }, {});
  } catch {
    // Broken JSON or access errors should not break quiz rendering.
    return {};
  }
}

function trimHistoryMap(historyMap) {
  const dates = Object.keys(historyMap).sort((a, b) => a.localeCompare(b));
  if (dates.length <= MAX_DAYS_STORED) {
    return historyMap;
  }

  const datesToKeep = new Set(dates.slice(-MAX_DAYS_STORED));
  return Object.entries(historyMap).reduce((acc, [date, entry]) => {
    if (datesToKeep.has(date)) {
      acc[date] = entry;
    }
    return acc;
  }, {});
}

function writeHistoryMap(historyMap) {
  if (!isBrowserStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(DAILY_QUIZ_HISTORY_KEY, JSON.stringify(historyMap));
  } catch {
    // Ignore write/quota failures to keep app usable.
  }
}

export function createAndStoreTodayQuiz(sourceQuestions, quizTransform) {
  const todayDate = toLocalDateKey();
  const baseQuestions = Array.isArray(sourceQuestions) ? sourceQuestions : [];
  const transformedQuestions =
    typeof quizTransform === 'function' ? quizTransform(baseQuestions) : baseQuestions;
  const questionsSnapshot = cloneQuestions(transformedQuestions);

  const historyMap = readHistoryMap();
  historyMap[todayDate] = {
    date: todayDate,
    savedAt: new Date().toISOString(),
    // Snapshot makes each day independent from future edits to questions.js.
    questions: questionsSnapshot
  };

  writeHistoryMap(trimHistoryMap(historyMap));
  return questionsSnapshot;
}

export function getDailyQuizHistory() {
  const historyMap = readHistoryMap();
  return Object.values(historyMap).sort((a, b) => a.date.localeCompare(b.date));
}

export function getDailyQuizByDate(date) {
  if (!date) {
    return null;
  }

  const historyMap = readHistoryMap();
  return historyMap[date] || null;
}

export function buildMegaQuizFromDates(dates) {
  if (!Array.isArray(dates) || dates.length === 0) {
    return [];
  }

  const historyMap = readHistoryMap();
  const uniqueDates = Array.from(new Set(dates));

  return uniqueDates.flatMap((date) => {
    const entry = historyMap[date];
    if (!entry) {
      return [];
    }

    // Re-clone so caller can shuffle/mutate megaquiz safely.
    return cloneQuestions(entry.questions);
  });
}
