'use client';

import { useEffect, useRef } from 'react';
import type { ChoiceUiMode, FeedbackState } from '@/features/quiz/types';
import type { QuizAnswerState, QuizQuestion } from '@/types/quiz';
import { AlertCircleIcon, CheckCircleIcon, SparklesIcon } from './icons';
import FlashOptionList from './flash-option-list';

interface WhySectionProps {
  question: QuizQuestion;
  answer: QuizAnswerState;
  feedback: FeedbackState;
  onSelect: (optionIndex: number) => void;
  choiceUi: ChoiceUiMode;
}

export default function WhySection({
  question,
  answer,
  feedback,
  onSelect,
  choiceUi
}: WhySectionProps): JSX.Element | null {
  // Goal: Reveal and focus the conceptual phase only after main answer is correct.
  const firstOptionInputRef = useRef<HTMLInputElement | null>(null);
  const firstOptionCardRef = useRef<HTMLButtonElement | null>(null);
  const shouldReveal = question.requiresWhy && answer.mainCorrect;

  useEffect(() => {
    // Goal: Move keyboard flow naturally into the newly revealed section.
    if (shouldReveal) {
      if (choiceUi === 'flashcards') {
        firstOptionCardRef.current?.focus({ preventScroll: true });
      } else {
        firstOptionInputRef.current?.focus({ preventScroll: true });
      }
    }
  }, [choiceUi, shouldReveal, question.id]);

  if (!question.requiresWhy || !question.whyOptions || !question.whyQuestion) {
    return null;
  }

  if (!shouldReveal) {
    return null;
  }

  const resolvedFeedbackState: FeedbackState = feedback.text
    ? feedback
    : answer.whyCorrect
      ? { text: 'Concept mastered.', tone: 'success' }
      : { text: 'Select the best explanation to complete mastery.', tone: 'neutral' };

  if (choiceUi === 'flashcards') {
    return (
      <section aria-label="Why section" className="question-section why-section">
        <header>
          <p className="section-label section-label--with-icon">
            <SparklesIcon className="inline-icon" />
            <span>Why This Is Correct</span>
          </p>
          <h3 className="question-subtitle">{question.whyQuestion}</h3>
        </header>
        <FlashOptionList
          feedback={resolvedFeedbackState}
          firstOptionRef={firstOptionCardRef}
          isCorrectSelection={answer.whyCorrect}
          isLocked={answer.whyLocked}
          legend="Select the best conceptual explanation"
          onSelect={onSelect}
          options={question.whyOptions}
          phaseKey="why"
          questionId={question.id}
          selectedIndex={answer.whySelection}
        />
      </section>
    );
  }

  return (
    <section aria-label="Why section" className="question-section why-section">
      <header>
        <p className="section-label section-label--with-icon">
          <SparklesIcon className="inline-icon" />
          <span>Why This Is Correct</span>
        </p>
        <h3 className="question-subtitle">{question.whyQuestion}</h3>
      </header>

      <fieldset className="option-list" disabled={answer.whyLocked}>
        <legend className="sr-only">Select the best conceptual explanation</legend>

        {question.whyOptions.map((option, index) => {
          // Goal: Mirror main question marker rules for consistency.
          const isSelected = answer.whySelection === index;
          const showCorrect = answer.whyCorrect && option.isCorrect;
          const showIncorrect = !answer.whyCorrect && isSelected && !option.isCorrect;

          const optionClassName = [
            'option-item',
            showCorrect ? 'option-item--correct' : '',
            showIncorrect ? 'option-item--incorrect' : '',
            answer.whyLocked ? 'option-item--locked' : ''
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <label
              className={optionClassName}
              key={`${question.id}-why-${index}`}
              onClick={() => {
                // Goal: Preserve full-row click affordance while respecting lock state.
                if (!answer.whyLocked) {
                  onSelect(index);
                }
              }}
            >
              <input
                aria-label={`Why option ${index + 1}: ${option.text}`}
                checked={isSelected}
                className="sr-only"
                disabled={answer.whyLocked}
                name={`why-${question.id}`}
                onChange={() => onSelect(index)}
                ref={index === 0 ? firstOptionInputRef : null}
                type="radio"
              />

              <span className="option-text">
                <span aria-hidden="true" className="option-prefix">
                  {String.fromCharCode(65 + index)}
                </span>
                {option.text}
              </span>

              {isSelected ? (
                <p
                  aria-live="polite"
                  className={`feedback feedback--${resolvedFeedbackState.tone} feedback--with-icon`}
                >
                  {resolvedFeedbackState.tone === 'success' ? (
                    <CheckCircleIcon className="inline-icon" />
                  ) : (
                    <AlertCircleIcon className="inline-icon" />
                  )}
                  {resolvedFeedbackState.text}
                </p>
              ) : null}
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
