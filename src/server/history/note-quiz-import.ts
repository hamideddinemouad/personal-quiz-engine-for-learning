import { toLocalDateKey } from '@/lib/date';
import { logInfo } from '@/server/logging';
import { createDailyQuizHistoryEntry, listDailyQuizHistoryEntries } from '@/server/history/repository';
import { NOTE_QUIZ_SEEDS } from '@/server/history/note-quiz-seeds';

const MAX_DATE_ATTEMPTS_PER_NOTE = 3650;

interface ImportedNoteQuizEntry {
  slug: string;
  subject: string;
  date: string;
}

export interface ImportNoteQuizHistoryResult {
  created: ImportedNoteQuizEntry[];
  skippedSubjects: string[];
  createdCount: number;
  skippedCount: number;
  total: number;
}

function toSubjectKey(subject: string | null): string {
  return typeof subject === 'string' ? subject.trim().toLowerCase() : '';
}

export async function importNoteQuizzesIntoHistory(): Promise<ImportNoteQuizHistoryResult> {
  const historyEntries = await listDailyQuizHistoryEntries();
  const existingDates = new Set(historyEntries.map((entry) => entry.date));
  const existingSubjectKeys = new Set(
    historyEntries
      .map((entry) => toSubjectKey(entry.subject))
      .filter((subjectKey) => subjectKey.length > 0)
  );

  const created: ImportedNoteQuizEntry[] = [];
  const skippedSubjects: string[] = [];
  const cursorDate = new Date();
  cursorDate.setHours(12, 0, 0, 0);

  for (const noteSeed of NOTE_QUIZ_SEEDS) {
    const subjectKey = toSubjectKey(noteSeed.subject);
    if (existingSubjectKeys.has(subjectKey)) {
      skippedSubjects.push(noteSeed.subject);
      continue;
    }

    let createdForSubject = false;

    for (let attempt = 0; attempt < MAX_DATE_ATTEMPTS_PER_NOTE; attempt += 1) {
      const targetDate = toLocalDateKey(cursorDate);
      cursorDate.setDate(cursorDate.getDate() - 1);

      if (existingDates.has(targetDate)) {
        continue;
      }

      const createdEntry = await createDailyQuizHistoryEntry(
        targetDate,
        noteSeed.questions,
        noteSeed.subject
      );

      if (!createdEntry) {
        existingDates.add(targetDate);
        continue;
      }

      existingDates.add(createdEntry.date);
      existingSubjectKeys.add(subjectKey);
      created.push({
        slug: noteSeed.slug,
        subject: noteSeed.subject,
        date: createdEntry.date
      });
      createdForSubject = true;
      break;
    }

    if (!createdForSubject) {
      skippedSubjects.push(noteSeed.subject);
    }
  }

  logInfo('history.note_import.completed', {
    total: NOTE_QUIZ_SEEDS.length,
    createdCount: created.length,
    skippedCount: skippedSubjects.length
  });

  return {
    created,
    skippedSubjects,
    createdCount: created.length,
    skippedCount: skippedSubjects.length,
    total: NOTE_QUIZ_SEEDS.length
  };
}
