# Personal Quiz Engine for Learning

A focused React quiz app for active recall practice, built with Vite and Tailwind CSS.

The app presents a two-step learning flow per question:
1. Answer the main multiple-choice question.
2. If correct, answer a follow-up "Why" question to confirm conceptual understanding.

Question progress is tracked in real time as:
- `UNATTEMPTED`
- `PARTIAL` (main answer is correct, why answer not yet correct)
- `MASTERED` (main + why are both correct, or main only for questions without why)

## Features

- Two-phase question model (`main` + `why`) for deeper mastery
- Option-level feedback for both correct and incorrect selections
- Retry behavior for incorrect answers (questions stay interactive until solved)
- Locked state after correct answers to prevent accidental changes
- Sidebar navigator with:
  - Per-question status icons
  - Direct question jumping
  - Previous/Next navigation
  - Live stopwatch (`mm:ss`)
- Daily quiz snapshot stored in `localStorage`
- Choice shuffling on page load to reduce memorizing option positions
- Accessible interaction patterns:
  - Semantic fieldsets/labels
  - Keyboard support for radio choices
  - `aria-live` feedback regions
  - `aria-current` on active question

## Tech Stack

- React 18
- Vite 5
- Tailwind CSS 3
- `lucide-react` for icons
- `framer-motion` for Why section reveal animation

## Project Structure

```text
src/
  components/
    QuizEngine.jsx            # Main layout: question area + sidebar
    QuestionCard.jsx          # Orchestrates main/why sections + local feedback text
    MainQuestion.jsx          # Main question UI and hint toggle
    WhySection.jsx            # Gated "why" explanation phase with animation
    SidebarNavigation.jsx     # Question status grid + stopwatch + prev/next
  context/
    QuizContext.jsx           # Core quiz state, status logic, actions, timer
  data/
    questions.js              # Quiz bank (10 MCQ items with whyOptions)
  utils/
    dailyQuizHistoryStorage.js # Daily snapshot persistence + history helpers
  constants/
    quizStatus.js             # UNATTEMPTED / PARTIAL / MASTERED
  App.jsx
  main.jsx
  index.css
```

## How the Quiz Works

### 1) App bootstrap

- `App.jsx` wraps `QuizEngine` with `QuizProvider`.
- `QuizProvider` receives `questions` from `src/data/questions.js`.

### 2) Daily snapshot creation

On initialization, `QuizProvider` calls:

- `createAndStoreTodayQuiz(questions, shuffleQuestionChoices)`

This does three things:
- Clones question data (to avoid mutating the original source)
- Shuffles `options` and `whyOptions`
- Stores the resulting quiz under today's date in `localStorage` key:
  - `quiz-daily-history-v1`

If today's entry already exists, it is overwritten with the latest generated snapshot.

### 3) Answer state model

Each question gets a state bucket:

```js
{
  mainSelection: null,
  mainCorrect: false,
  mainLocked: false,
  whySelection: null,
  whyCorrect: false,
  whyLocked: false
}
```

Behavior:
- Main incorrect: selection updates, remains unlocked (retry allowed)
- Main correct: marks correct + locks main phase
- Why section only unlocks when main is correct
- Why incorrect: updates selection, remains unlocked
- Why correct: marks correct + locks why phase

### 4) Status derivation

Status is computed from correctness flags (not UI text):
- If main is not correct -> `UNATTEMPTED`
- If main correct and question has no why -> `MASTERED`
- If main correct and why not correct -> `PARTIAL`
- If both correct -> `MASTERED`

### 5) Progress + navigation

Context exposes:
- `statusesById`
- `progress` summary (`total`, `masteredCount`, `partialCount`)
- `goToQuestion(index)` for direct navigation

Sidebar renders status icons:
- Empty circle: unattempted
- Dot circle: partial
- Green check circle: mastered

## Data Contract for Questions

Each question in `src/data/questions.js` follows this shape:

```js
{
  id: 'q1',
  type: 'mcq',
  question: '...',
  options: [
    { text: '...', isCorrect: true, feedback: '...' },
    { text: '...', isCorrect: false, feedback: '...' }
  ],
  hint: '...',
  requiresWhy: true,
  whyQuestion: '...',
  whyOptions: [
    { text: '...', isCorrect: true, feedback: '...' },
    { text: '...', isCorrect: false, feedback: '...' }
  ]
}
```


## Local Storage Utilities

`src/utils/dailyQuizHistoryStorage.js` includes:
- `createAndStoreTodayQuiz(...)`
- `getDailyQuizHistory()`
- `getDailyQuizByDate(date)`
- `buildMegaQuizFromDates(dates)`

History is capped to `365` stored days.

Even though only `createAndStoreTodayQuiz` is currently used by UI flow, the other helpers are ready for extensions like "review old days" or "mega quiz across dates."

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
npm install
```

### Run development server

```bash
npm run dev
```

### Build production bundle

```bash
npm run build
```

### Preview production build

```bash
npm run preview
```

## Styling and UI Notes

- Tailwind is configured via `tailwind.config.js` and `postcss.config.js`.
- Global styles are in `src/index.css`.
- App uses a dark gradient background and slate-based UI theme.
- Why section reveal uses `framer-motion` height/opacity animation.

