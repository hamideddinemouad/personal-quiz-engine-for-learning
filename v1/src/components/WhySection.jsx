import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

function WhySection({ question, answer, onSelect, feedback }) {
  // Why section appears only after main phase correctness (gated progression).
  const shouldReveal = question.requiresWhy && answer.mainCorrect;
  // We focus the first option when revealed to keep keyboard flow continuous.
  const firstOptionRef = useRef(null);
  // If no explicit feedback was set yet, show instructional default text.
  const resolvedFeedbackText =
    feedback.text || (answer.whyCorrect ? 'Concept mastered.' : 'Select the best explanation to complete mastery.');

  useEffect(() => {
    if (shouldReveal) {
      // Keep keyboard focus progression without forcing page scroll on reveal.
      firstOptionRef.current?.focus({ preventScroll: true });
    }
  }, [shouldReveal, question.id]);

  if (!question.requiresWhy) {
    return null;
  }

  return (
    <AnimatePresence initial={false}>
      {shouldReveal ? (
        <motion.section
          // Height + opacity animation gives a smooth "expand under main question"
          // effect while preserving the DOM order for screen readers.
          animate={{ height: 'auto', opacity: 1 }}
          aria-label="Why justification section"
          className="overflow-hidden border-t border-slate-700 pt-5"
          exit={{ height: 0, opacity: 0 }}
          initial={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Why This Is Correct
              </p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">{question.whyQuestion}</h3>
            </div>

            <fieldset className="space-y-3" disabled={answer.whyLocked}>
              <legend className="sr-only">Select the best conceptual explanation</legend>
              {question.whyOptions.map((option, index) => {
                const isSelected = answer.whySelection === index;
                // Same marker rules as main phase: show solved correct answer,
                // or currently selected wrong answer while retrying.
                const showCorrect = answer.whyCorrect && option.isCorrect;
                const showIncorrect = !answer.whyCorrect && isSelected && !option.isCorrect;

                return (
                  <label
                    key={`${question.id}-why-${index}`}
                    className={[
                      'block cursor-pointer rounded-xl border border-slate-700 px-4 py-3 transition',
                      'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-slate-900',
                      // Match main-question behavior: strong graded colors and no hover override
                      // after correctness is known.
                      showCorrect
                        ? 'border-emerald-400 bg-emerald-500/20'
                        : showIncorrect
                          ? 'border-rose-400 bg-rose-500/20'
                          : 'hover:border-slate-500 hover:bg-slate-800',
                      answer.whyLocked ? 'cursor-not-allowed opacity-90' : ''
                    ].join(' ')}
                  >
                    <input
                      aria-label={`Why option ${index + 1}: ${option.text}`}
                      checked={isSelected}
                      className="sr-only"
                      disabled={answer.whyLocked}
                      onKeyDown={(event) => {
                        // Keeps parity with click behavior for keyboard users.
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          onSelect(index);
                        }
                      }}
                      name={`why-${question.id}`}
                      onChange={() => onSelect(index)}
                      ref={index === 0 ? firstOptionRef : null}
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
                    {/* Render rationale directly under the selected explanation choice. */}
                    {isSelected && resolvedFeedbackText ? (
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
                        {resolvedFeedbackText}
                      </p>
                    ) : null}
                  </label>
                );
              })}
            </fieldset>
          </div>
        </motion.section>
      ) : null}
    </AnimatePresence>
  );
}

export default WhySection;
