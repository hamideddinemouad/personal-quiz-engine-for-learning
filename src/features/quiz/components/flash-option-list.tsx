'use client';

import { useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import type { FeedbackState } from '@/features/quiz/types';
import type { QuizOption } from '@/types/quiz';
import { AlertCircleIcon, CheckCircleIcon } from './icons';

const RESHUFFLE_LOCK_MS = 1000;

function createInitialOrder(length: number): number[] {
  return Array.from({ length }, (_, index) => index);
}

function shuffleOrder(order: number[]): number[] {
  const nextOrder = [...order];

  for (let index = nextOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextOrder[index], nextOrder[swapIndex]] = [nextOrder[swapIndex], nextOrder[index]];
  }

  return nextOrder;
}

function shuffleToDifferentOrder(order: number[]): number[] {
  if (order.length < 2) {
    return order;
  }

  let nextOrder = shuffleOrder(order);
  let attempts = 0;

  while (attempts < 4 && nextOrder.every((value, index) => value === order[index])) {
    nextOrder = shuffleOrder(order);
    attempts += 1;
  }

  return nextOrder;
}

interface FlashOptionListProps {
  questionId: string;
  phaseKey: 'main' | 'why';
  legend: string;
  options: QuizOption[];
  selectedIndex: number | null;
  isCorrectSelection: boolean;
  isLocked: boolean;
  feedback: FeedbackState;
  onSelect: (optionIndex: number) => void;
  firstOptionRef?: Ref<HTMLButtonElement>;
}

export default function FlashOptionList({
  questionId,
  phaseKey,
  legend,
  options,
  selectedIndex,
  isCorrectSelection,
  isLocked,
  feedback,
  onSelect,
  firstOptionRef
}: FlashOptionListProps): JSX.Element {
  const [displayOrder, setDisplayOrder] = useState<number[]>(() => createInitialOrder(options.length));
  const [revealedOptionIndex, setRevealedOptionIndex] = useState<number | null>(null);
  const [pendingSelectionIndex, setPendingSelectionIndex] = useState<number | null>(null);
  const [pendingResetAfterError, setPendingResetAfterError] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [isReshuffling, setIsReshuffling] = useState(false);
  const reshuffleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplayOrder(createInitialOrder(options.length));
    setRevealedOptionIndex(null);
    setPendingSelectionIndex(null);
    setPendingResetAfterError(false);
    setIsErrorVisible(false);
    setIsReshuffling(false);
    if (reshuffleTimerRef.current !== null) {
      window.clearTimeout(reshuffleTimerRef.current);
      reshuffleTimerRef.current = null;
    }
  }, [phaseKey, questionId, options.length]);

  useEffect(
    () => () => {
      if (reshuffleTimerRef.current !== null) {
        window.clearTimeout(reshuffleTimerRef.current);
        reshuffleTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (feedback.tone === 'error' && !isLocked) {
      setPendingResetAfterError(true);
      setIsErrorVisible(true);
      setPendingSelectionIndex(null);
      if (selectedIndex !== null) {
        setRevealedOptionIndex(selectedIndex);
      }
      return;
    }

    setPendingResetAfterError(false);
    setIsErrorVisible(false);
  }, [feedback.text, feedback.tone, isLocked, selectedIndex]);

  const pendingDisplayIndex =
    pendingSelectionIndex === null ? -1 : displayOrder.indexOf(pendingSelectionIndex);
  const pendingChoiceLabel =
    pendingDisplayIndex >= 0 ? `Choice ${String.fromCharCode(65 + pendingDisplayIndex)}` : 'Choice';

  return (
    <div className="flash-option-stack">
      <fieldset className={`flash-option-grid ${isReshuffling ? 'flash-option-grid--reshuffling' : ''}`}>
        <legend className="sr-only">{legend}</legend>

        {displayOrder.map((optionIndex, displayIndex) => {
          const option = options[optionIndex];
          if (!option) {
            return null;
          }

          const letter = String.fromCharCode(65 + displayIndex);
          const isSelected = selectedIndex === optionIndex;
          const isPending = pendingSelectionIndex === optionIndex;
          const isRevealed = revealedOptionIndex === optionIndex;
          const showTransientWrong =
            feedback.tone === 'error' &&
            isErrorVisible &&
            isSelected &&
            isRevealed &&
            !option.isCorrect;
          const shouldShowResolvedState = isLocked || feedback.tone === 'success';
          const showCorrect = shouldShowResolvedState && isCorrectSelection && option.isCorrect;
          const showIncorrect =
            showTransientWrong ||
            (shouldShowResolvedState && !isCorrectSelection && isSelected && !option.isCorrect);

          const cardClassName = [
            'flash-option-card',
            isRevealed ? 'flash-option-card--revealed' : '',
            isReshuffling ? 'flash-option-card--reshuffling' : '',
            isPending ? 'flash-option-card--pending' : '',
            isSelected && shouldShowResolvedState ? 'flash-option-card--selected' : '',
            showCorrect ? 'flash-option-card--correct' : '',
            showIncorrect ? 'flash-option-card--incorrect' : '',
            isLocked ? 'flash-option-card--locked' : ''
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <button
              aria-label={`${legend} option ${displayIndex + 1}: ${option.text}`}
              aria-pressed={isRevealed}
              className={cardClassName}
              disabled={isReshuffling}
              key={`${questionId}-${phaseKey}-${optionIndex}`}
              onClick={() => {
                if (isReshuffling) {
                  return;
                }

                if (pendingResetAfterError) {
                  // First click after an incorrect answer clears old wrong state and reshuffles.
                  setDisplayOrder((currentOrder) => shuffleToDifferentOrder(currentOrder));
                  setPendingResetAfterError(false);
                  setIsErrorVisible(false);
                  setRevealedOptionIndex(null);
                  setPendingSelectionIndex(null);

                  setIsReshuffling(true);
                  if (reshuffleTimerRef.current !== null) {
                    window.clearTimeout(reshuffleTimerRef.current);
                  }
                  reshuffleTimerRef.current = window.setTimeout(() => {
                    setIsReshuffling(false);
                    reshuffleTimerRef.current = null;
                  }, RESHUFFLE_LOCK_MS);
                  return;
                }

                const shouldClose = isRevealed;
                if (shouldClose) {
                  setRevealedOptionIndex(null);
                  setPendingSelectionIndex(null);
                  return;
                }

                setRevealedOptionIndex(optionIndex);
                if (!isLocked) {
                  setPendingSelectionIndex(optionIndex);
                }
              }}
              ref={displayIndex === 0 ? firstOptionRef : undefined}
              style={
                {
                  '--shuffle-dir': displayIndex % 2 === 0 ? -1 : 1,
                  '--shuffle-depth': `${10 + (displayIndex % 3) * 3}px`
                } as CSSProperties
              }
              type="button"
            >
              <span className="flash-option-inner">
                <span aria-hidden={isRevealed} className="flash-option-face flash-option-face--front">
                  <span className="flash-option-label-row">
                    <span aria-hidden="true" className="option-prefix">
                      {letter}
                    </span>
                    <span className="flash-option-label">Choice {letter}</span>
                  </span>
                  <span className="flash-option-prompt">
                    {isRevealed ? 'Tap to hide' : 'Tap to reveal'}
                  </span>
                </span>
                <span aria-hidden={!isRevealed} className="flash-option-face flash-option-face--back">
                  <span className="option-text">
                    <span aria-hidden="true" className="option-prefix">
                      {letter}
                    </span>
                    {option.text}
                  </span>

                  {isSelected && feedback.text && (shouldShowResolvedState || showTransientWrong) ? (
                    <span className={`feedback feedback--${feedback.tone} feedback--with-icon flash-option-feedback`}>
                      {feedback.tone === 'success' ? (
                        <CheckCircleIcon className="inline-icon" />
                      ) : (
                        <AlertCircleIcon className="inline-icon" />
                      )}
                      {feedback.text}
                    </span>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
      </fieldset>
      {!isLocked ? (
        <div className="flash-option-actions">
          <button
            className="button button--primary"
            disabled={pendingSelectionIndex === null || isReshuffling}
            onClick={() => {
              if (pendingSelectionIndex === null) {
                return;
              }

              onSelect(pendingSelectionIndex);
            }}
            type="button"
          >
            <span className="button-content">
              Confirm {pendingChoiceLabel}
            </span>
          </button>
          {isReshuffling ? (
            <p className="muted-text">Shuffling cards...</p>
          ) : pendingSelectionIndex === null ? (
            <p className="muted-text">Reveal a flashcard first, then confirm your choice.</p>
          ) : (
            <p className="muted-text">Press confirm to submit this answer.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
