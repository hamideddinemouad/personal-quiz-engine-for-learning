'use client';

import { useEffect, useState } from 'react';
import { QuizProvider } from '@/features/quiz/context/quiz-context';
import type { ChoiceUiMode } from '@/features/quiz/types';
import { shuffleQuestionChoices } from '@/lib/quiz-transform';
import type { QuizQuestion } from '@/types/quiz';
import QuizEngine from './quiz-engine';

interface QuizAppProps {
  initialQuestions: QuizQuestion[];
  initialNeedsDailySetup?: boolean;
  initialQuizSubject?: string | null;
  initialStudyStreakDays: number;
  dailyMasteredGoal: number;
  initialDailySnapshotError?: string | null;
  choiceUi?: ChoiceUiMode;
}

interface MegaQuizApiResponse {
  questions?: QuizQuestion[];
  error?: string;
}

interface TodayQuizApiResponse {
  subject?: string | null;
  questions?: QuizQuestion[];
  error?: string;
}

type DailySetupMode = 'load' | 'shuffle' | 'json';

const JSON_QUIZ_TEMPLATE = `{
  "subject": "SQL Advanced Fundamentals",
  "questions": [
    {
      "id": "q1",
      "question": "What is the correct logical order of SQL query execution?",
      "hint": "Execution order differs from written syntax.",
      "requiresWhy": true,
      "options": [
        {
          "text": "FROM -> JOIN -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY",
          "isCorrect": true,
          "feedback": "Correct: SQL builds and filters row sets before projection and final sorting."
        },
        {
          "text": "SELECT -> FROM -> WHERE -> GROUP BY -> HAVING -> ORDER BY",
          "isCorrect": false,
          "feedback": "That is written syntax order, but execution starts from source row construction."
        },
        {
          "text": "FROM -> WHERE -> SELECT -> ORDER BY -> GROUP BY -> HAVING",
          "isCorrect": false,
          "feedback": "Grouping and HAVING must occur before projection and after row filtering."
        },
        {
          "text": "WHERE -> FROM -> GROUP BY -> SELECT -> HAVING -> ORDER BY",
          "isCorrect": false,
          "feedback": "WHERE cannot run first because rows do not exist before FROM/JOIN."
        }
      ],
      "whyQuestion": "Why does SQL execute FROM/JOIN before SELECT?",
      "whyOptions": [
        {
          "text": "Because SQL must construct the working row set before choosing output columns.",
          "isCorrect": true,
          "feedback": "Exactly: projection requires a formed dataset, so source resolution happens first."
        },
        {
          "text": "Because SELECT is only for aliases and never controls returned columns.",
          "isCorrect": false,
          "feedback": "Incorrect: SELECT directly controls projection, but only after row-set creation."
        },
        {
          "text": "Because ORDER BY always decides which rows are available to SELECT.",
          "isCorrect": false,
          "feedback": "ORDER BY only sorts final output and does not create eligible rows."
        },
        {
          "text": "Because HAVING defines base tables before joins are evaluated.",
          "isCorrect": false,
          "feedback": "HAVING filters groups later; it does not participate in table resolution."
        }
      ]
    }
  ]
}`;

const AI_GENERATOR_PROMPT_TEMPLATE = `You are converting raw study notes into quiz JSON for a strict validator.

Task:
- Convert the notes below into one JSON object with "subject" and "questions".

Hard output rules (must follow):
- output must be JSON only (no comments or extra text).
- output in code fences.
- Do not include comments or explanations.
- Use double quotes for all keys and string values.
- Ensure the result can be parsed with JSON.parse (no trailing commas).
- The top-level value must be one JSON object with:
  - "subject": non-empty string
  - "questions": non-empty array of quiz questions
- IDs must be unique in order: q1, q2, q3, ...
- output at least 8 questions and maximum 12 questions

Question schema (exact field names):
{
  "subject": "string",
  "questions": [
    {
      "id": "q1",
      "question": "string",
      "hint": "string (optional)",
      "requiresWhy": true,
      "options": [
        { "text": "string", "isCorrect": true, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" }
      ],
      "whyQuestion": "string",
      "whyOptions": [
        { "text": "string", "isCorrect": true, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" },
        { "text": "string", "isCorrect": false, "feedback": "string" }
      ]
    }
  ]
}

Non-negotiable validation constraints:
- Top-level must be an object.
- "subject" must be a non-empty string.
- "questions" must be a non-empty array.
- IDs in "questions" must be unique in order: q1, q2, q3, ...
- Every question must have a non-empty "question" string.
- Every question must set "requiresWhy": true.
- Every question must include non-empty "whyQuestion".
- Every question must include non-empty "whyOptions".
- "options" must contain exactly 4 items.
- "whyOptions" must contain exactly 4 items.
- Each "options" item must have non-empty "text", boolean "isCorrect", and non-empty "feedback".
- Each "whyOptions" item must have non-empty "text", boolean "isCorrect", and non-empty "feedback".
- "options" must contain exactly one correct answer.
- "whyOptions" must contain exactly one correct answer.
- Never output empty arrays for "options" or "whyOptions".
- Include "hint" only when genuinely useful.

Feedback quality constraints (important):
- Feedback must be compact for UI: one sentence, about 8-20 words.
- Feedback must be informative: explain reasoning, not just "Correct" or "Wrong".
- Correct-option feedback should explain why that choice is valid.
- Wrong-option feedback should explain the misconception and hint the right principle.
- Keep tone direct, technical, and concise.

Content quality constraints:
- Keep wording clear and concise.
- Use plausible distractors tied to common confusion from the notes.
- Make options and whyOptions equally plausible: avoid obvious giveaways like one choice being much longer, more specific, or more polished than the others.
- Do not output placeholders like "TBD", "...", or "<...>".

Before finalizing, silently self-check:
1. Output shape is { subject, questions } with non-empty values.
2. Every question has whyQuestion + 4 whyOptions.
3. Every options/whyOptions array has exactly 4 items.
4. Exactly one isCorrect=true in each options and each whyOptions array.
5. JSON is valid and parseable.

JSON structure example:
${JSON_QUIZ_TEMPLATE}

Raw notes:
<your notes here>`;
const RAW_NOTES_PLACEHOLDER = '<your notes here>';

function extractJsonPayload(input: string): string {
  const trimmedInput = input.trim();
  const codeFenceMatch = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmedInput);

  // Support direct pasting of AI output wrapped in ```json ... ```.
  return codeFenceMatch ? codeFenceMatch[1].trim() : trimmedInput;
}

function buildAiPromptWithNotes(rawNotes: string): string {
  const normalizedNotes = rawNotes.trim() || RAW_NOTES_PLACEHOLDER;
  return AI_GENERATOR_PROMPT_TEMPLATE.replace(RAW_NOTES_PLACEHOLDER, normalizedNotes);
}

export default function QuizApp({
  initialQuestions,
  initialNeedsDailySetup = false,
  initialQuizSubject = null,
  initialStudyStreakDays,
  dailyMasteredGoal,
  initialDailySnapshotError = null,
  choiceUi = 'standard'
}: QuizAppProps): JSX.Element {
  const buildSessionQuestions = (questions: QuizQuestion[]): QuizQuestion[] =>
    shuffleQuestionChoices(questions);
  const isFlashMode = choiceUi === 'flashcards';

  // Goal: Keep the active quiz session replaceable in-place (daily -> mega quiz)
  // without a full page refresh.
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() =>
    buildSessionQuestions(initialQuestions)
  );
  // Goal: Force a fresh provider state when we swap to a new question set.
  // Incrementing this key remounts QuizProvider and resets answer/timer state.
  const [quizSessionVersion, setQuizSessionVersion] = useState(0);
  const [needsDailySetup, setNeedsDailySetup] = useState(
    initialNeedsDailySetup || initialQuestions.length === 0
  );
  const [quizSubject, setQuizSubject] = useState<string | null>(initialQuizSubject);
  const [jsonQuizInput, setJsonQuizInput] = useState('');
  const [activeDailySetupMode, setActiveDailySetupMode] = useState<DailySetupMode | null>(null);
  const [isPreparingDailyQuiz, setIsPreparingDailyQuiz] = useState(false);
  const [dailySnapshotError, setDailySnapshotError] = useState<string | null>(
    initialDailySnapshotError
  );
  const [isJsonTemplateModalOpen, setIsJsonTemplateModalOpen] = useState(false);
  const [aiRawNotesInput, setAiRawNotesInput] = useState('');
  const [jsonTemplateFeedback, setJsonTemplateFeedback] = useState<string | null>(null);
  const [isShufflingMegaQuiz, setIsShufflingMegaQuiz] = useState(false);
  const [shuffleError, setShuffleError] = useState<string | null>(null);

  useEffect(() => {
    if (!isJsonTemplateModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsJsonTemplateModalOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isJsonTemplateModalOpen]);

  const handleCreateTodayQuiz = async (mode: DailySetupMode, questions?: unknown): Promise<void> => {
    if (isPreparingDailyQuiz) {
      return;
    }

    setIsPreparingDailyQuiz(true);
    setActiveDailySetupMode(mode);
    setDailySnapshotError(null);

    try {
      const response = await fetch('/api/quiz/today', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          mode,
          questions
        })
      });

      const payload = (await response.json()) as TodayQuizApiResponse;

      if (!response.ok) {
        setDailySnapshotError(payload.error || 'Unable to create today quiz.');
        return;
      }

      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        setDailySnapshotError('No questions were returned for today quiz.');
        return;
      }

      setQuizQuestions(buildSessionQuestions(payload.questions));
      setQuizSubject(payload.subject ?? null);
      setQuizSessionVersion((current) => current + 1);
      setNeedsDailySetup(false);
    } catch {
      setDailySnapshotError('Network error while creating today quiz.');
    } finally {
      setIsPreparingDailyQuiz(false);
      setActiveDailySetupMode(null);
    }
  };

  const handleCreateTodayQuizFromJson = async (): Promise<void> => {
    if (!jsonQuizInput.trim()) {
      setDailySnapshotError('Paste quiz JSON first.');
      return;
    }

    let parsedQuestions: unknown;
    try {
      parsedQuestions = JSON.parse(extractJsonPayload(jsonQuizInput));
    } catch {
      setDailySnapshotError('JSON is invalid. If using code fences, ensure the inner JSON is valid.');
      return;
    }

    await handleCreateTodayQuiz('json', parsedQuestions);
  };

  const handleCopyAiPromptTemplate = async (): Promise<void> => {
    const fullPrompt = buildAiPromptWithNotes(aiRawNotesInput);

    try {
      await navigator.clipboard.writeText(fullPrompt);
      setJsonTemplateFeedback('Full AI prompt copied with your raw notes section.');
    } catch {
      setJsonTemplateFeedback('Copy failed. Select and copy the AI prompt manually.');
    }
  };

  const handleShuffleMegaQuiz = async (): Promise<void> => {
    // Goal: Request a brand-new mega quiz from server history and replace current session.
    if (isShufflingMegaQuiz) {
      return;
    }

    // Step 1: Enter loading state and clear stale errors.
    setIsShufflingMegaQuiz(true);
    setShuffleError(null);

    try {
      // Step 2: Ask server to build shuffled mega quiz from past days.
      const response = await fetch('/api/quiz/mega', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ mode: 'shuffle' })
      });

      const payload = (await response.json()) as MegaQuizApiResponse;

      if (!response.ok) {
        // Step 3a: Show API-provided error (e.g. no past history yet).
        setShuffleError(payload.error || 'Unable to build mega quiz from past history.');
        return;
      }

      if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
        // Step 3b: Defensive guard for malformed/empty success responses.
        setShuffleError('No mega quiz questions were returned.');
        return;
      }

      // Step 4: Swap questions and remount provider for a clean run.
      setQuizQuestions(buildSessionQuestions(payload.questions));
      setQuizSubject('Shuffled Mega Quiz (session)');
      setQuizSessionVersion((current) => current + 1);
    } catch {
      // Step 5: Report network/runtime failures.
      setShuffleError('Network error while generating mega quiz.');
    } finally {
      setIsShufflingMegaQuiz(false);
    }
  };

  const handleLoadQuizTemporarily = (questions: QuizQuestion[], subject: string | null): void => {
    if (!Array.isArray(questions) || questions.length === 0) {
      setShuffleError('Unable to load temporary quiz: no questions available.');
      return;
    }

    setShuffleError(null);
    setDailySnapshotError(null);
    setQuizQuestions(buildSessionQuestions(questions));
    setQuizSubject(subject);
    setQuizSessionVersion((current) => current + 1);
  };

  const handleTodayEntryDeleted = (): void => {
    setNeedsDailySetup(true);
    setDailySnapshotError(null);
    setShuffleError(null);
  };

  const aiPromptWithNotes = buildAiPromptWithNotes(aiRawNotesInput);

  if (needsDailySetup) {
    return (
      <main className="quiz-page">
        <section className="card-surface daily-setup">
          <p className="section-label">Quiz Of The Day</p>
          <h1 className="quiz-title">No quiz is saved for today yet.</h1>
          <p className="muted-text">
            Choose one option to create today&apos;s quiz from the database.
          </p>
          <div className="daily-setup__actions">
            <button
              className="button button--primary"
              disabled={isPreparingDailyQuiz}
              onClick={() => {
                void handleCreateTodayQuiz('load');
              }}
              type="button"
            >
              {activeDailySetupMode === 'load'
                ? isFlashMode
                  ? 'Loading Flashcards...'
                  : 'Loading Quiz...'
                : isFlashMode
                  ? 'Load Latest Flashcards'
                  : 'Load Latest Quiz'}
            </button>
            <button
              className="button button--ghost"
              disabled={isPreparingDailyQuiz}
              onClick={() => {
                void handleCreateTodayQuiz('shuffle');
              }}
              type="button"
            >
              {activeDailySetupMode === 'shuffle'
                ? isFlashMode
                  ? 'Shuffling Mega Flashcards...'
                  : 'Shuffling Mega Quiz...'
                : isFlashMode
                  ? 'Shuffle Mega Flashcards'
                  : 'Shuffle Mega Quiz'}
            </button>
          </div>
          <label className="history-field daily-setup__field">
            <span className="history-field__label">Quiz JSON</span>
            <textarea
              className="history-input daily-setup__json"
              onChange={(event) => setJsonQuizInput(event.target.value)}
              placeholder='[{...}] or {"subject":"TypeScript","questions":[...]}'
              value={jsonQuizInput}
            />
          </label>
          <div className="daily-setup__template-row">
            <button
              className="button button--ghost"
              onClick={() => {
                setJsonTemplateFeedback(null);
                setIsJsonTemplateModalOpen(true);
              }}
              type="button"
            >
              Open AI Prompt Builder
            </button>
            <p className="muted-text">Use this when you need a ready-to-copy AI prompt.</p>
          </div>
          <button
            className="button button--ghost"
            disabled={isPreparingDailyQuiz}
            onClick={() => {
              void handleCreateTodayQuizFromJson();
            }}
            type="button"
          >
            {activeDailySetupMode === 'json'
              ? isFlashMode
                ? 'Saving JSON Flashcards...'
                : 'Saving JSON Quiz...'
              : isFlashMode
                ? 'Use JSON Flashcards As Today'
                : 'Use JSON Quiz As Today'}
          </button>
          {dailySnapshotError ? <p className="feedback feedback--error">{dailySnapshotError}</p> : null}
        </section>

        {isJsonTemplateModalOpen ? (
          <div
            aria-hidden="true"
            className="json-template-modal-overlay"
            onClick={() => {
              setIsJsonTemplateModalOpen(false);
            }}
            role="presentation"
          >
            <section
              aria-labelledby="json-template-modal-title"
              aria-modal="true"
              className="json-template-modal"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
            >
              <header className="json-template-modal__header">
                <div>
                  <p className="section-label">Quick start</p>
                  <h2 className="quiz-title" id="json-template-modal-title">
                    AI Prompt Builder
                  </h2>
                </div>
                <button
                  className="button button--ghost"
                  onClick={() => {
                    setIsJsonTemplateModalOpen(false);
                  }}
                  type="button"
                >
                  Close
                </button>
              </header>

              <p className="muted-text">
                Paste your notes once, then copy the full prompt.
              </p>
              <label className="history-field">
                <span className="history-field__label">Raw notes</span>
                <textarea
                  className="history-input daily-setup__json"
                  onChange={(event) => setAiRawNotesInput(event.target.value)}
                  placeholder="Paste your study notes here"
                  rows={8}
                  spellCheck={false}
                  value={aiRawNotesInput}
                />
              </label>
              <pre className="json-template-modal__pre">{aiPromptWithNotes}</pre>
              <div className="json-template-modal__actions">
                <button
                  className="button button--primary"
                  onClick={() => {
                    void handleCopyAiPromptTemplate();
                  }}
                  type="button"
                >
                  Copy Full Prompt
                </button>
              </div>
              {jsonTemplateFeedback ? (
                <p className="feedback feedback--neutral">{jsonTemplateFeedback}</p>
              ) : null}
            </section>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <QuizProvider key={quizSessionVersion} questions={quizQuestions}>
      <QuizEngine
        choiceUi={choiceUi}
        dailyMasteredGoal={dailyMasteredGoal}
        initialDailySnapshotError={dailySnapshotError}
        quizSubject={quizSubject}
        initialStudyStreakDays={initialStudyStreakDays}
        isShufflingMegaQuiz={isShufflingMegaQuiz}
        onShuffleMegaQuiz={handleShuffleMegaQuiz}
        onLoadQuizTemporarily={handleLoadQuizTemporarily}
        onTodayEntryDeleted={handleTodayEntryDeleted}
        shuffleError={shuffleError}
      />
    </QuizProvider>
  );
}
