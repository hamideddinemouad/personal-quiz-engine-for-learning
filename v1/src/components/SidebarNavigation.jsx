import { CheckCircle2, Circle, CircleDot } from 'lucide-react';
import { QUIZ_STATUS } from '../constants/quizStatus';
import { useQuizContext } from '../context/QuizContext';

function formatStopwatch(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function SidebarNavigation() {
  // Sidebar reflects live status for each question and supports random access.
  const { questions, currentQuestionIndex, statusesById, elapsedSeconds, goToQuestion } =
    useQuizContext();

  const iconForStatus = (status) => {
    // Icon semantics:
    // - UNATTEMPTED: empty circle
    // - PARTIAL: half-state marker (CircleDot)
    // - MASTERED: green check circle
    if (status === QUIZ_STATUS.MASTERED) {
      return <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-emerald-400" />;
    }

    if (status === QUIZ_STATUS.PARTIAL) {
      return <CircleDot aria-hidden="true" className="h-4 w-4 text-sky-400" />;
    }

    return <Circle aria-hidden="true" className="h-4 w-4 text-slate-500" />;
  };

  return (
    <aside className="h-fit rounded-2xl border border-slate-700 bg-slate-900/90 p-4 shadow-lg shadow-black/20 lg:sticky lg:top-6">
      <h2 className="text-sm font-semibold text-slate-200">Question Navigator</h2>
      <p aria-live="polite" className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Stopwatch: <span className="font-mono text-slate-100">{formatStopwatch(elapsedSeconds)}</span>
      </p>
      <div aria-label="Question list" className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-4">
        {questions.map((question, index) => {
          const status = statusesById[question.id];
          // aria-current improves orientation for assistive technologies.
          const isCurrent = index === currentQuestionIndex;

          return (
            <button
              aria-current={isCurrent ? 'true' : undefined}
              aria-label={`Go to question ${index + 1}`}
              className={[
                'inline-flex items-center justify-between rounded-lg border px-2.5 py-2 text-sm font-medium transition',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                isCurrent
                  ? 'border-sky-400 bg-sky-500/15 text-sky-300'
                  : 'border-slate-700 text-slate-200 hover:border-slate-500 hover:bg-slate-800'
              ].join(' ')}
              key={question.id}
              onClick={() => goToQuestion(index)}
              type="button"
            >
              <span>{index + 1}</span>
              {iconForStatus(status)}
            </button>
          );
        })}
      </div>
      {/* Keep linear navigation with the sidebar so all question movement controls live together. */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-700 pt-4">
        <button
          aria-label="Go to previous question"
          className="rounded-md border border-slate-600 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          disabled={currentQuestionIndex === 0}
          onClick={() => goToQuestion(currentQuestionIndex - 1)}
          type="button"
        >
          Previous
        </button>
        <button
          aria-label="Go to next question"
          className="rounded-md bg-sky-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          disabled={currentQuestionIndex === questions.length - 1}
          onClick={() => goToQuestion(currentQuestionIndex + 1)}
          type="button"
        >
          Next
        </button>
      </div>
    </aside>
  );
}

export default SidebarNavigation;
