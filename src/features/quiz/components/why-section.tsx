'use client';

import { useEffect, useRef } from 'react';
import type { FeedbackState } from '@/features/quiz/types';
import type { QuizAnswerState, QuizQuestion } from '@/types/quiz';
import { AlertCircleIcon, CheckCircleIcon, SparklesIcon } from './icons';

interface WhySectionProps {
  question: QuizQuestion;
  answer: QuizAnswerState;
  feedback: FeedbackState;
  onSelect: (optionIndex: number) => void;
}

export default function WhySection({
  question,
  answer,
  feedback,
  onSelect
}: WhySectionProps): JSX.Element | null {
  const firstOptionRef = useRef<HTMLInputElement | null>(null);
  const shouldReveal = question.requiresWhy && answer.mainCorrect;

  useEffect(() => {
    if (shouldReveal) {
      firstOptionRef.current?.focus({ preventScroll: true });
    }
  }, [shouldReveal, question.id]);

  if (!question.requiresWhy || !question.whyOptions || !question.whyQuestion) {
    return null;
  }

  if (!shouldReveal) {
    return null;
  }

  const resolvedFeedbackText =
    feedback.text ||
    (answer.whyCorrect
      ? 'Concept mastered.'
      : 'Select the best explanation to complete mastery.');

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
                ref={index === 0 ? firstOptionRef : null}
                type="radio"
              />

              <span className="option-text">
                <span aria-hidden="true" className="option-prefix">
                  {String.fromCharCode(65 + index)}
                </span>
                {option.text}
              </span>

              {isSelected ? (
                <p aria-live="polite" className={`feedback feedback--${feedback.tone} feedback--with-icon`}>
                  {feedback.tone === 'success' ? (
                    <CheckCircleIcon className="inline-icon" />
                  ) : (
                    <AlertCircleIcon className="inline-icon" />
                  )}
                  {resolvedFeedbackText}
                </p>
              ) : null}
            </label>
          );
        })}
      </fieldset>
    </section>
  );
}
