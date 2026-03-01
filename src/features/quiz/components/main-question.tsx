'use client';

import { useEffect, useState } from 'react';
import type { ChoiceUiMode, FeedbackState } from '@/features/quiz/types';
import type { QuizAnswerState, QuizQuestion } from '@/types/quiz';
import { AlertCircleIcon, CheckCircleIcon, LightbulbIcon, SparklesIcon } from './icons';
import FlashOptionList from './flash-option-list';

interface MainQuestionProps {
  question: QuizQuestion;
  answer: QuizAnswerState;
  feedback: FeedbackState;
  onSelect: (optionIndex: number) => void;
  choiceUi: ChoiceUiMode;
}

export default function MainQuestion({
  question,
  answer,
  feedback,
  onSelect,
  choiceUi
}: MainQuestionProps): JSX.Element {
  // Goal: Keep hint visibility as local UI state, independent from scoring state.
  const [isHintVisible, setIsHintVisible] = useState(false);

  useEffect(() => {
    setIsHintVisible(false);
  }, [question.id]);

  return (
    <section aria-label="Main question" className="question-section">
      <header>
        <p className="section-label section-label--with-icon">
          <SparklesIcon className="inline-icon" />
          <span>Main Question</span>
        </p>
        <h2 className="question-title">{question.question}</h2>

        {question.hint ? (
          <div className="hint-block">
            <button
              aria-controls={`hint-${question.id}`}
              aria-expanded={isHintVisible}
              className="button button--ghost"
              onClick={() => setIsHintVisible((current) => !current)}
              type="button"
            >
              <span className="button-content">
                <LightbulbIcon className="inline-icon" />
                {isHintVisible ? 'Hide hint' : 'Show hint'}
              </span>
            </button>
            {isHintVisible ? (
              <p className="hint-text" id={`hint-${question.id}`}>
                Hint: {question.hint}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      {choiceUi === 'flashcards' ? (
        <FlashOptionList
          feedback={feedback}
          isCorrectSelection={answer.mainCorrect}
          isLocked={answer.mainLocked}
          legend="Select the best answer"
          onSelect={onSelect}
          options={question.options}
          phaseKey="main"
          questionId={question.id}
          selectedIndex={answer.mainSelection}
        />
      ) : (
        <fieldset className="option-list" disabled={answer.mainLocked}>
          <legend className="sr-only">Select the best answer</legend>

          {question.options.map((option, index) => {
            // Goal: Render visual correctness markers without mutating answer state here.
            const isSelected = answer.mainSelection === index;
            const showCorrect = answer.mainCorrect && option.isCorrect;
            const showIncorrect = !answer.mainCorrect && isSelected && !option.isCorrect;

            const optionClassName = [
              'option-item',
              showCorrect ? 'option-item--correct' : '',
              showIncorrect ? 'option-item--incorrect' : '',
              answer.mainLocked ? 'option-item--locked' : ''
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <label
                className={optionClassName}
                key={`${question.id}-main-${index}`}
                onClick={() => {
                  // Goal: Keep the full card clickable for better UX.
                  // We still guard locked state to avoid accidental late clicks.
                  if (!answer.mainLocked) {
                    onSelect(index);
                  }
                }}
              >
                <input
                  aria-label={`Main option ${index + 1}: ${option.text}`}
                  checked={isSelected}
                  className="sr-only"
                  disabled={answer.mainLocked}
                  name={`main-${question.id}`}
                  onChange={() => onSelect(index)}
                  type="radio"
                />

                <span className="option-text">
                  <span aria-hidden="true" className="option-prefix">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.text}
                </span>

                {isSelected && feedback.text ? (
                  <p aria-live="polite" className={`feedback feedback--${feedback.tone} feedback--with-icon`}>
                    {feedback.tone === 'success' ? (
                      <CheckCircleIcon className="inline-icon" />
                    ) : (
                      <AlertCircleIcon className="inline-icon" />
                    )}
                    {feedback.text}
                  </p>
                ) : null}
              </label>
            );
          })}
        </fieldset>
      )}
    </section>
  );
}
