'use client';

import { useEffect, useMemo, useState } from 'react';
import { toLocalDateKey } from '@/lib/date';
import type { DailyQuizHistoryEntry } from '@/types/quiz';
import { AlertCircleIcon, CheckCircleIcon } from './icons';

interface HistoryCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryApiResponse {
  history?: DailyQuizHistoryEntry[];
  error?: string;
}

interface MutationApiResponse {
  entry?: DailyQuizHistoryEntry;
  error?: string;
}

interface HistoryByDateApiResponse {
  entry?: DailyQuizHistoryEntry;
  error?: string;
}

interface HistorySummaryRow {
  date: string;
  subject: string | null;
  savedAt: string;
  questionCount: number;
}

const LEGACY_SUBJECT_PLACEHOLDER = 'No subject (legacy entry)';

function toSummaryRows(entries: DailyQuizHistoryEntry[]): HistorySummaryRow[] {
  return [...entries]
    .map((entry) => ({
      date: entry.date,
      subject: entry.subject ?? null,
      savedAt: entry.savedAt,
      questionCount: Array.isArray(entry.questions) ? entry.questions.length : 0
    }))
    .sort((left, right) => right.date.localeCompare(left.date));
}

function formatQuestionsJson(entry: DailyQuizHistoryEntry): string {
  return JSON.stringify(entry.questions, null, 2);
}

export default function HistoryCrudModal({ isOpen, onClose }: HistoryCrudModalProps): JSX.Element | null {
  const [rows, setRows] = useState<HistorySummaryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [activeRowAction, setActiveRowAction] = useState<string | null>(null);
  const [readingDate, setReadingDate] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<DailyQuizHistoryEntry | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(
    null
  );
  const [createDate, setCreateDate] = useState(toLocalDateKey());
  const [sourceDate, setSourceDate] = useState('');
  const [createSubjectInput, setCreateSubjectInput] = useState('');
  const [createQuestionsInput, setCreateQuestionsInput] = useState('');
  const [selectedSubjectInput, setSelectedSubjectInput] = useState('');
  const [selectedQuestionsInput, setSelectedQuestionsInput] = useState('');
  const [renameInputs, setRenameInputs] = useState<Record<string, string>>({});

  const sourceOptions = useMemo(() => rows.map((row) => row.date), [rows]);

  const refreshHistory = async (): Promise<void> => {
    setIsLoading(true);
    setModalFeedback(null);

    try {
      const response = await fetch('/api/quiz/history', { cache: 'no-store' });
      const payload = (await response.json()) as HistoryApiResponse;

      if (!response.ok || !Array.isArray(payload.history)) {
        setModalFeedback({
          tone: 'error',
          text: payload.error || 'Unable to load quiz history.'
        });
        return;
      }

      const summaryRows = toSummaryRows(payload.history);
      setRows(summaryRows);

      // Goal: Keep rename input fields in sync with latest row keys after mutations.
      setRenameInputs(Object.fromEntries(summaryRows.map((row) => [row.date, row.date])));

      // Goal: If selected entry was deleted/renamed, clear stale JSON preview.
      if (selectedEntry && !summaryRows.some((row) => row.date === selectedEntry.date)) {
        setSelectedEntry(null);
        setSelectedSubjectInput('');
        setSelectedQuestionsInput('');
      }

      if (summaryRows.length > 0) {
        setSourceDate((currentValue) =>
          currentValue && summaryRows.some((row) => row.date === currentValue)
            ? currentValue
            : summaryRows[0].date
        );
      } else {
        setSourceDate('');
      }
    } catch {
      setModalFeedback({
        tone: 'error',
        text: 'Network error while loading quiz history.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    void refreshHistory();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // Goal: Modal UX guardrails:
    // - Escape key closes quickly.
    // - Body scroll is locked while overlay is open.
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isBusy = isLoading || isCreating || Boolean(activeRowAction) || Boolean(readingDate);

  const handleCreate = async (): Promise<void> => {
    setModalFeedback(null);
    const hasJsonInput = Boolean(createQuestionsInput.trim());

    if (!createDate) {
      setModalFeedback({
        tone: 'error',
        text: 'Select a target date.'
      });
      return;
    }

    if (!hasJsonInput && !sourceDate) {
      setModalFeedback({
        tone: 'error',
        text: 'Choose a source date or paste JSON questions.'
      });
      return;
    }

    setIsCreating(true);

    try {
      let requestBody: Record<string, unknown> = {
        date: createDate
      };

      if (hasJsonInput) {
        let parsedQuestions: unknown;
        try {
          parsedQuestions = JSON.parse(createQuestionsInput);
        } catch {
          setModalFeedback({
            tone: 'error',
            text: 'Create JSON is invalid. Fix the JSON syntax first.'
          });
          return;
        }

        requestBody = {
          ...requestBody,
          subject: createSubjectInput,
          questions: parsedQuestions
        };
      } else {
        requestBody = {
          ...requestBody,
          sourceDate
        };
      }

      const response = await fetch('/api/quiz/history', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      const payload = (await response.json()) as MutationApiResponse;

      if (!response.ok) {
        setModalFeedback({
          tone: 'error',
          text: payload.error || 'Unable to create history entry.'
        });
        return;
      }

      await refreshHistory();
      setModalFeedback({
        tone: 'success',
        text: hasJsonInput
          ? `Created ${createDate} from pasted JSON.`
          : `Created ${createDate} from source ${sourceDate}.`
      });

      if (hasJsonInput) {
        setCreateQuestionsInput('');
        setCreateSubjectInput('');
      }
    } catch {
      setModalFeedback({
        tone: 'error',
        text: 'Network error while creating history entry.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRename = async (currentDate: string): Promise<void> => {
    setModalFeedback(null);
    const nextDate = (renameInputs[currentDate] || '').trim();
    if (!nextDate) {
      setModalFeedback({
        tone: 'error',
        text: 'Updated date cannot be empty.'
      });
      return;
    }

    setActiveRowAction(`rename:${currentDate}`);

    try {
      const response = await fetch(`/api/quiz/history/${encodeURIComponent(currentDate)}`, {
        method: 'PUT',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ nextDate })
      });
      const payload = (await response.json()) as MutationApiResponse;

      if (!response.ok) {
        setModalFeedback({
          tone: 'error',
          text: payload.error || 'Unable to update history date.'
        });
        return;
      }

      await refreshHistory();
      setModalFeedback({
        tone: 'success',
        text: `Updated ${currentDate} -> ${nextDate}.`
      });
    } catch {
      setModalFeedback({
        tone: 'error',
        text: 'Network error while updating history date.'
      });
    } finally {
      setActiveRowAction(null);
    }
  };

  const handleDelete = async (date: string): Promise<void> => {
    setModalFeedback(null);
    if (!window.confirm(`Delete history row for ${date}?`)) {
      return;
    }

    setActiveRowAction(`delete:${date}`);

    try {
      const response = await fetch(`/api/quiz/history/${encodeURIComponent(date)}`, {
        method: 'DELETE'
      });
      const payload = (await response.json()) as MutationApiResponse;

      if (!response.ok) {
        setModalFeedback({
          tone: 'error',
          text: payload.error || 'Unable to delete history entry.'
        });
        return;
      }

      await refreshHistory();
      setModalFeedback({
        tone: 'success',
        text: `Deleted history row for ${date}.`
      });
      if (selectedEntry?.date === date) {
        setSelectedEntry(null);
        setSelectedSubjectInput('');
        setSelectedQuestionsInput('');
      }
    } catch {
      setModalFeedback({
        tone: 'error',
        text: 'Network error while deleting history entry.'
      });
    } finally {
      setActiveRowAction(null);
    }
  };

  const handleReadJson = async (date: string): Promise<void> => {
    setModalFeedback(null);
    setReadingDate(date);

    try {
      const response = await fetch(`/api/quiz/history/${encodeURIComponent(date)}`, {
        cache: 'no-store'
      });
      const payload = (await response.json()) as HistoryByDateApiResponse;

      if (!response.ok || !payload.entry) {
        setModalFeedback({
          tone: 'error',
          text: payload.error || 'Unable to read history JSON.'
        });
        return;
      }

      setSelectedEntry(payload.entry);
      setSelectedSubjectInput(payload.entry.subject || '');
      setSelectedQuestionsInput(formatQuestionsJson(payload.entry));
      setModalFeedback({
        tone: 'success',
        text: `Loaded JSON for ${date}.`
      });
    } catch {
      setModalFeedback({
        tone: 'error',
        text: 'Network error while reading history JSON.'
      });
    } finally {
      setReadingDate(null);
    }
  };

  const handleSaveSelectedJson = async (): Promise<void> => {
    setModalFeedback(null);

    if (!selectedEntry) {
      setModalFeedback({
        tone: 'error',
        text: 'Load a row first.'
      });
      return;
    }

    if (!selectedQuestionsInput.trim()) {
      setModalFeedback({
        tone: 'error',
        text: 'Questions JSON cannot be empty.'
      });
      return;
    }

    let parsedQuestions: unknown;
    try {
      parsedQuestions = JSON.parse(selectedQuestionsInput);
    } catch {
      setModalFeedback({
        tone: 'error',
        text: 'Questions JSON is invalid. Fix syntax before saving.'
      });
      return;
    }

    setActiveRowAction(`save-json:${selectedEntry.date}`);

    try {
      const response = await fetch(`/api/quiz/history/${encodeURIComponent(selectedEntry.date)}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          subject: selectedSubjectInput,
          questions: parsedQuestions
        })
      });
      const payload = (await response.json()) as MutationApiResponse;

      if (!response.ok || !payload.entry) {
        setModalFeedback({
          tone: 'error',
          text: payload.error || 'Unable to save JSON changes.'
        });
        return;
      }

      setSelectedEntry(payload.entry);
      setSelectedSubjectInput(payload.entry.subject || '');
      setSelectedQuestionsInput(formatQuestionsJson(payload.entry));
      await refreshHistory();
      setModalFeedback({
        tone: 'success',
        text: `Saved JSON for ${selectedEntry.date}.`
      });
    } catch {
      setModalFeedback({
        tone: 'error',
        text: 'Network error while saving JSON changes.'
      });
    } finally {
      setActiveRowAction(null);
    }
  };

  return (
    <div
      aria-hidden="true"
      className="history-modal-overlay"
      onClick={() => {
        if (!isBusy) {
          onClose();
        }
      }}
      role="presentation"
    >
      <section
        aria-labelledby="history-modal-title"
        aria-modal="true"
        className="history-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="history-modal__header">
          <div>
            <p className="section-label">Database tools</p>
            <h2 className="quiz-title" id="history-modal-title">
              History CRUD
            </h2>
          </div>
          <button className="button button--ghost" disabled={isBusy} onClick={onClose} type="button">
            Close
          </button>
        </header>

        <section className="history-modal__section">
          <h3 className="history-modal__section-title">Create</h3>
          <div className="history-create-grid">
            <label className="history-field">
              <span className="history-field__label">Target date</span>
              <input
                className="history-input"
                onChange={(event) => setCreateDate(event.target.value)}
                type="date"
                value={createDate}
              />
            </label>
            <label className="history-field">
              <span className="history-field__label">Copy from source date</span>
              <select
                className="history-input"
                onChange={(event) => setSourceDate(event.target.value)}
                value={sourceDate}
              >
                <option value="">Select source date</option>
                {sourceOptions.map((optionDate) => (
                  <option key={optionDate} value={optionDate}>
                    {optionDate}
                  </option>
                ))}
              </select>
            </label>
            <label className="history-field">
              <span className="history-field__label">Subject (optional)</span>
              <input
                className="history-input"
                onChange={(event) => setCreateSubjectInput(event.target.value)}
                placeholder="JSON Quiz"
                type="text"
                value={createSubjectInput}
              />
            </label>
            <label className="history-field history-field--full">
              <span className="history-field__label">Questions JSON (optional)</span>
              <textarea
                className="history-input history-json__textarea"
                onChange={(event) => setCreateQuestionsInput(event.target.value)}
                placeholder="Paste a JSON array of questions to create without copying another date."
                rows={9}
                spellCheck={false}
                value={createQuestionsInput}
              />
            </label>
          </div>
          <p className="muted-text">
            If Questions JSON is filled, create will use that JSON and ignore source date copy.
          </p>

          <button
            className="button button--primary"
            disabled={isBusy || (!sourceDate && !createQuestionsInput.trim())}
            onClick={handleCreate}
            type="button"
          >
            {isCreating
              ? 'Creating...'
              : createQuestionsInput.trim()
                ? 'Create Row From JSON'
                : 'Create Row'}
          </button>
        </section>

        <section className="history-modal__section">
          <div className="history-modal__section-header">
            <h3 className="history-modal__section-title">Read / Update / Delete</h3>
            <button className="button button--ghost" disabled={isBusy} onClick={() => void refreshHistory()} type="button">
              Refresh
            </button>
          </div>

          {isLoading ? <p className="muted-text">Loading history...</p> : null}
          {!isLoading && rows.length === 0 ? <p className="muted-text">No history rows found.</p> : null}

          {!isLoading && rows.length > 0 ? (
            <ul className="history-row-list">
              {rows.map((row) => {
                const rowAction = activeRowAction;
                const isRenaming = rowAction === `rename:${row.date}`;
                const isDeleting = rowAction === `delete:${row.date}`;

                return (
                  <li className="history-row" key={row.date}>
                    <div className="history-row__meta">
                      <p className="history-row__title">
                        {row.date} • {row.subject || LEGACY_SUBJECT_PLACEHOLDER}
                      </p>
                      <p className="muted-text">
                        Saved: {new Date(row.savedAt).toLocaleString()} • Questions: {row.questionCount}
                      </p>
                    </div>

                    <div className="history-row__actions">
                      <input
                        className="history-input"
                        onChange={(event) =>
                          setRenameInputs((current) => ({
                            ...current,
                            [row.date]: event.target.value
                          }))
                        }
                        type="date"
                        value={renameInputs[row.date] || row.date}
                      />
                      <button
                        className="button button--ghost"
                        disabled={isBusy}
                        onClick={() => void handleReadJson(row.date)}
                        type="button"
                      >
                        {readingDate === row.date ? 'Reading...' : 'Read JSON'}
                      </button>
                      <button
                        className="button button--ghost"
                        disabled={isBusy}
                        onClick={() => void handleRename(row.date)}
                        type="button"
                      >
                        {isRenaming ? 'Updating...' : 'Update Date'}
                      </button>
                      <button
                        className="button button--ghost history-delete-button"
                        disabled={isBusy}
                        onClick={() => void handleDelete(row.date)}
                        type="button"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <section className="history-modal__section">
          <h3 className="history-modal__section-title">JSON Content</h3>
          {selectedEntry ? (
            <div className="history-json">
              <p className="muted-text">
                Date: {selectedEntry.date} • Saved:{' '}
                {new Date(selectedEntry.savedAt).toLocaleString()}
              </p>
              <label className="history-field">
                <span className="history-field__label">Subject</span>
                <input
                  className="history-input"
                  onChange={(event) => setSelectedSubjectInput(event.target.value)}
                  type="text"
                  value={selectedSubjectInput}
                />
              </label>
              <label className="history-field">
                <span className="history-field__label">Questions JSON</span>
                <textarea
                  className="history-input history-json__textarea"
                  onChange={(event) => setSelectedQuestionsInput(event.target.value)}
                  rows={13}
                  spellCheck={false}
                  value={selectedQuestionsInput}
                />
              </label>
              <div className="history-json__actions">
                <button
                  className="button button--primary"
                  disabled={isBusy}
                  onClick={() => void handleSaveSelectedJson()}
                  type="button"
                >
                  {activeRowAction === `save-json:${selectedEntry.date}` ? 'Saving...' : 'Save JSON'}
                </button>
                <button
                  className="button button--ghost"
                  disabled={isBusy}
                  onClick={() => {
                    setSelectedSubjectInput(selectedEntry.subject || '');
                    setSelectedQuestionsInput(formatQuestionsJson(selectedEntry));
                  }}
                  type="button"
                >
                  Reset
                </button>
              </div>
            </div>
          ) : (
            <p className="muted-text">Click `Read JSON` on any row to load and edit full content.</p>
          )}
        </section>

        {modalFeedback ? (
          <p
            aria-live="polite"
            className={`feedback feedback--${modalFeedback.tone} feedback--with-icon history-modal__feedback`}
          >
            {modalFeedback.tone === 'success' ? (
              <CheckCircleIcon className="inline-icon" />
            ) : (
              <AlertCircleIcon className="inline-icon" />
            )}
            {modalFeedback.text}
          </p>
        ) : null}
      </section>
    </div>
  );
}
