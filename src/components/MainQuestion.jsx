import { Check, Lightbulb, X } from 'lucide-react';
import { useState } from 'react';

function MainQuestion({ question, answer, onSelect, feedback }) {
  const selectedOption = answer.mainSelection;
  const isLocked = answer.mainLocked;
  // Hint visibility is a local view concern and does not affect mastery.
  const [isHintVisible, setIsHintVisible] = useState(false);

  return (
    <section aria-label="Main question" className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Main Question</p>
        <h2 className="mt-2 text-xl font-semibold text-slate-100">{question.question}</h2>
        {question.hint ? (
          <div className="mt-3">
            <button
              aria-controls={`hint-${question.id}`}
              aria-expanded={isHintVisible}
              className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              onClick={() => setIsHintVisible((prev) => !prev)}
              type="button"
            >
              <Lightbulb className="h-4 w-4 text-amber-500" />
              {isHintVisible ? 'Hide hint' : 'Show hint'}
            </button>
            {isHintVisible ? (
              <p className="mt-2 text-sm text-slate-300" id={`hint-${question.id}`}>
                Hint: {question.hint}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <fieldset className="space-y-3" disabled={isLocked}>
        <legend className="sr-only">Select the best answer</legend>
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index;
          // Correct marker appears once main answer is solved and locked.
          const showCorrect = answer.mainCorrect && option.isCorrect;
          // Incorrect marker appears only on the currently selected wrong answer.
          // This still allows retries because the question remains unlocked.
          const showIncorrect = !answer.mainCorrect && isSelected && !option.isCorrect;

          return (
            <label
              key={`${question.id}-main-${index}`}
              className={[
                'block cursor-pointer rounded-xl border border-slate-700 px-4 py-3 transition',
                'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-slate-900',
                // Keep correctness states obvious: stronger success/error colors,
                // and only apply neutral hover styling before an answer is graded.
                showCorrect
                  ? 'border-emerald-400 bg-emerald-500/20'
                  : showIncorrect
                    ? 'border-rose-400 bg-rose-500/20'
                    : 'hover:border-slate-500 hover:bg-slate-800',
                isLocked ? 'cursor-not-allowed opacity-90' : ''
              ].join(' ')}
            >
              <input
                aria-label={`Main option ${index + 1}: ${option.text}`}
                checked={isSelected}
                className="sr-only"
                disabled={isLocked}
                onKeyDown={(event) => {
                  // Radio inputs already support arrow-key navigation.
                  // Enter handler is added for users who expect submit-like behavior.
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onSelect(index);
                  }
                }}
                name={`main-${question.id}`}
                onChange={() => onSelect(index)}
                type="radio"
              />
              <span className="flex items-start gap-3">
                <span className="mt-1 inline-flex h-4 w-4 shrink-0 rounded-full border border-slate-500 bg-slate-900" />
                <span className="text-sm font-medium text-slate-100">{option.text}</span>
                <span className="ml-auto mt-0.5 inline-flex h-5 w-5 items-center justify-center">
                  {showCorrect ? <Check aria-hidden="true" className="h-4 w-4 text-emerald-300" /> : null}
                  {showIncorrect ? <X aria-hidden="true" className="h-4 w-4 text-rose-300" /> : null}
                </span>
              </span>
              {/* Keep explanation attached to the selected option for immediate context. */}
              {isSelected && feedback.text ? (
                <p
                  aria-live="polite"
                  className={[
                    'mt-2 pl-7 text-sm',
                    feedback.tone === 'success'
                      ? 'text-emerald-200'
                      : feedback.tone === 'error'
                        ? 'text-rose-200'
                        : 'text-slate-300'
                  ].join(' ')}
                >
                  {feedback.text}
                </p>
              ) : null}
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}

export default MainQuestion;
