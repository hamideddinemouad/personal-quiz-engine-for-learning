'use client';

import { useEffect, useRef, useState, type CSSProperties, type Ref } from 'react';
import type { FeedbackState } from '@/features/quiz/types';
import type { QuizOption } from '@/types/quiz';
import { AlertCircleIcon, CheckCircleIcon } from './icons';

const RESHUFFLE_LOCK_MS = 1000;

function logFlashDebug(scope: string, event: string, details?: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  if (details) {
    console.log(`[quiz-debug][flash:${scope}] ${event}`, details);
    return;
  }

  console.log(`[quiz-debug][flash:${scope}] ${event}`);
}

function createInitialOrder(length: number): number[] {
  // Goal: Render options in original order before any reshuffle.
  return Array.from({ length }, (_, index) => index);
}

function shuffleOrder(order: number[]): number[] {
  // Goal: Standard Fisher-Yates shuffle over display indexes.
  const nextOrder = [...order];

  for (let index = nextOrder.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [nextOrder[index], nextOrder[swapIndex]] = [nextOrder[swapIndex], nextOrder[index]];
  }

  return nextOrder;
}

function shuffleToDifferentOrder(order: number[]): number[] {
  // Goal: Avoid a no-op shuffle where cards appear unchanged.
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
  // `displayOrder` stores a mapping from visual slot -> original option index.
  // This lets us reshuffle UI positions without mutating quiz data.
  const [displayOrder, setDisplayOrder] = useState<number[]>(() => createInitialOrder(options.length));
  // `revealedOptionIndex` tracks which card is currently flipped open.
  const [revealedOptionIndex, setRevealedOptionIndex] = useState<number | null>(null);
  // `pendingSelectionIndex` is the option selected for the Confirm button.
  const [pendingSelectionIndex, setPendingSelectionIndex] = useState<number | null>(null);
  // After a wrong answer, we delay reshuffle until the user's next click.
  const [pendingResetAfterError, setPendingResetAfterError] = useState(false);
  // Controls temporary wrong feedback while the incorrect card stays open.
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  // Lock interaction while reshuffle animation is running.
  const [isReshuffling, setIsReshuffling] = useState(false);
  // Stored in a ref so we can cancel timeout on question change/unmount.
  const reshuffleTimerRef = useRef<number | null>(null);
  const debugScope = `${phaseKey}:${questionId}`;

  useEffect(() => {
    // Goal: Reset all local flashcard UI state when question/phase changes.
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
    logFlashDebug(debugScope, 'reset-local-state', {
      optionsCount: options.length
    });
  }, [phaseKey, questionId, options.length]);

  useEffect(
    () => () => {
      // Goal: Prevent late timer updates after component unmount.
      if (reshuffleTimerRef.current !== null) {
        window.clearTimeout(reshuffleTimerRef.current);
        reshuffleTimerRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (feedback.tone === 'error' && !isLocked) {
      // Step 1: Keep wrong card visible now; reshuffle on next click.
      setPendingResetAfterError(true);
      setIsErrorVisible(true);
      setPendingSelectionIndex(null);
      if (selectedIndex !== null) {
        setRevealedOptionIndex(selectedIndex);
      }
      logFlashDebug(debugScope, 'enter-error-reset-mode', {
        feedbackTone: feedback.tone,
        selectedIndex,
        isLocked
      });
      return;
    }

    // Step 2: Clear temporary wrong-mode when feedback is no longer error.
    setPendingResetAfterError(false);
    setIsErrorVisible(false);
    if (feedback.tone) {
      logFlashDebug(debugScope, 'clear-error-reset-mode', {
        feedbackTone: feedback.tone,
        isLocked
      });
    }
  }, [feedback, isLocked, selectedIndex]);

  // Confirm label is based on current display order (A/B/C...) not raw option index.
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
          // Resolved state means we can permanently colorize result cards.
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
                logFlashDebug(debugScope, 'card-click', {
                  optionIndex,
                  displayIndex,
                  selectedIndex,
                  revealedOptionIndex,
                  pendingSelectionIndex,
                  pendingResetAfterError,
                  isReshuffling,
                  isLocked
                });

                if (isReshuffling) {
                  // Hard lock during animation window.
                  logFlashDebug(debugScope, 'card-click-ignored-reshuffling');
                  return;
                }

                if (pendingResetAfterError) {
                  // First click after an incorrect answer clears wrong state, reshuffles,
                  // and keeps this clicked card as the next pending confirmation target.
                  // Keep the card closed during movement; open it after reshuffle settles.
                  setDisplayOrder((currentOrder) => {
                    const reshuffledOrder = shuffleToDifferentOrder(currentOrder);
                    logFlashDebug(debugScope, 'error-reset-click-reshuffle', {
                      clickedOptionIndex: optionIndex,
                      previousDisplayOrder: currentOrder,
                      nextDisplayOrder: reshuffledOrder
                    });
                    return reshuffledOrder;
                  });
                  setPendingResetAfterError(false);
                  setIsErrorVisible(false);
                  setRevealedOptionIndex(null);
                  if (!isLocked) {
                    setPendingSelectionIndex(optionIndex);
                  }

                  setIsReshuffling(true);
                  if (reshuffleTimerRef.current !== null) {
                    window.clearTimeout(reshuffleTimerRef.current);
                  }
                  reshuffleTimerRef.current = window.setTimeout(() => {
                    setIsReshuffling(false);
                    setRevealedOptionIndex(optionIndex);
                    reshuffleTimerRef.current = null;
                    logFlashDebug(debugScope, 'reshuffle-lock-ended-open-selected', {
                      optionIndex
                    });
                  }, RESHUFFLE_LOCK_MS);
                  return;
                }

                const shouldClose = isRevealed;
                if (shouldClose) {
                  // Re-clicking an open card closes it and clears pending confirm selection.
                  setRevealedOptionIndex(null);
                  setPendingSelectionIndex(null);
                  logFlashDebug(debugScope, 'card-closed', {
                    optionIndex
                  });
                  return;
                }

                // Normal flow: open clicked card and mark it as pending for confirm.
                setRevealedOptionIndex(optionIndex);
                if (!isLocked) {
                  setPendingSelectionIndex(optionIndex);
                }
                logFlashDebug(debugScope, 'card-opened-pending-set', {
                  optionIndex
                });
              }}
              ref={displayIndex === 0 ? firstOptionRef : undefined}
              style={
                {
                  // CSS vars drive slight per-card variation in shuffle motion.
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
                logFlashDebug(debugScope, 'confirm-click-ignored-no-pending');
                return;
              }

              // Commit selection to parent quiz state only on explicit confirm.
              logFlashDebug(debugScope, 'confirm-click-submit', {
                pendingSelectionIndex
              });
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
