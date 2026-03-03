'use client';

import { useEffect, useState } from 'react';
import { useQuizContext } from '@/features/quiz/context/quiz-context';
import { EMPTY_FEEDBACK, type ChoiceUiMode, type FeedbackState } from '@/features/quiz/types';
import type { QuizQuestion } from '@/types/quiz';
import MainQuestion from './main-question';
import WhySection from './why-section';

interface QuestionCardProps {
  question: QuizQuestion;
  choiceUi: ChoiceUiMode;
}

function logQuestionCardDebug(
  questionId: string,
  phase: 'main' | 'why',
  details: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  console.log(`[quiz-debug][question-card:${questionId}:${phase}] selection-result`, details);
}

export default function QuestionCard({ question, choiceUi }: QuestionCardProps): JSX.Element {
  // Goal: Bridge global quiz state (correctness/locks) with local UI feedback copy.
  const { answersById, selectMainOption, selectWhyOption } = useQuizContext();
  const answer = answersById[question.id];

  const [mainFeedback, setMainFeedback] = useState<FeedbackState>(EMPTY_FEEDBACK);
  const [whyFeedback, setWhyFeedback] = useState<FeedbackState>(EMPTY_FEEDBACK);

  useEffect(() => {
    // Goal: Reset visual feedback when user navigates to a different question.
    setMainFeedback(EMPTY_FEEDBACK);
    setWhyFeedback(EMPTY_FEEDBACK);
  }, [question.id]);

  if (!answer) {
    return <article className="card-surface">Missing answer state for this question.</article>;
  }

  const handleMainSelect = (optionIndex: number): void => {
    // Goal: Translate state-machine result into user-facing feedback text.
    const { result } = selectMainOption(question.id, optionIndex);
    const selectedOption = question.options[optionIndex];
    logQuestionCardDebug(question.id, 'main', {
      optionIndex,
      result,
      optionIsCorrect: selectedOption?.isCorrect ?? null
    });

    if (result === 'correct') {
      setMainFeedback({
        text:
          selectedOption?.feedback ||
          'Correct. You can move to the conceptual explanation now.',
        tone: 'success'
      });

      if (question.requiresWhy) {
        setWhyFeedback({
          text: 'Main answer is correct. Complete the Why section to master this question.',
          tone: 'neutral'
        });
      }

      return;
    }

    if (result === 'incorrect') {
      setMainFeedback({
        text:
          selectedOption?.feedback ||
          'Incorrect. Re-check the options and try again.',
        tone: 'error'
      });
    }
  };

  const handleWhySelect = (optionIndex: number): void => {
    // Goal: Same as main phase, but for conceptual "why" mastery.
    const { result } = selectWhyOption(question.id, optionIndex);
    const selectedOption = question.whyOptions?.[optionIndex];
    logQuestionCardDebug(question.id, 'why', {
      optionIndex,
      result,
      optionIsCorrect: selectedOption?.isCorrect ?? null
    });

    if (result === 'correct') {
      setWhyFeedback({
        text: selectedOption?.feedback || 'Concept mastered.',
        tone: 'success'
      });
      return;
    }

    if (result === 'incorrect') {
      setWhyFeedback({
        text:
          selectedOption?.feedback ||
          'Not quite. Pick the strongest conceptual explanation.',
        tone: 'error'
      });
    }
  };

  return (
    <article className="card-surface">
      <MainQuestion
        question={question}
        answer={answer}
        choiceUi={choiceUi}
        feedback={mainFeedback}
        onSelect={handleMainSelect}
      />
      <WhySection
        question={question}
        answer={answer}
        choiceUi={choiceUi}
        feedback={whyFeedback}
        onSelect={handleWhySelect}
      />
    </article>
  );
}
