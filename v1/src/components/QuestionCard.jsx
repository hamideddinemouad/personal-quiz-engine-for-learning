import { useEffect, useState } from 'react';
import { useQuizContext } from '../context/QuizContext';
import MainQuestion from './MainQuestion';
import WhySection from './WhySection';

function QuestionCard({ question }) {
  const { answersById, selectMainOption, selectWhyOption } = useQuizContext();
  const answer = answersById[question.id];

  // Local UI feedback state is intentionally separate from quiz correctness
  // state, which stays in context.
  const [mainFeedback, setMainFeedback] = useState({ text: '', tone: 'neutral' });
  const [whyFeedback, setWhyFeedback] = useState({ text: '', tone: 'neutral' });

  // When the visible question changes, clear any old feedback messages.
  useEffect(() => {
    setMainFeedback({ text: '', tone: 'neutral' });
    setWhyFeedback({ text: '', tone: 'neutral' });
  }, [question.id]);

  const handleMainSelect = (optionIndex) => {
    const { result } = selectMainOption(question.id, optionIndex);
    const selectedOption = question.options?.[optionIndex];

    if (result === 'correct') {
      // Main phase is complete, optionally prompt learner into why-phase.
      setMainFeedback({
        text:
          selectedOption?.feedback ||
          'Correct. Great work. You selected the best answer and can now move to justification.',
        tone: 'success'
      });
      if (question.requiresWhy) {
        setWhyFeedback({ text: 'Now answer the Why question to complete mastery.', tone: 'neutral' });
      }
      return;
    }
    if (result === 'incorrect') {
      setMainFeedback({
        text:
          selectedOption?.feedback ||
          'Not quite. Review the concept and try again with the strongest option.',
        tone: 'error'
      });
    }
  };

  const handleWhySelect = (optionIndex) => {
    const { result } = selectWhyOption(question.id, optionIndex);
    const selectedOption = question.whyOptions?.[optionIndex];

    if (result === 'correct') {
      // Why-phase success implies full mastery for this question.
      setWhyFeedback({
        text:
          selectedOption?.feedback ||
          'Concept mastered. Your explanation matches the core reasoning behind the answer.',
        tone: 'success'
      });
      return;
    }
    if (result === 'incorrect') {
      setWhyFeedback({
        text:
          selectedOption?.feedback ||
          'That explanation is incomplete or incorrect. Re-check the mechanism and try again.',
        tone: 'error'
      });
    }
  };

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-lg shadow-black/20 sm:p-6">
      <MainQuestion
        question={question}
        answer={answer}
        feedback={mainFeedback}
        onSelect={handleMainSelect}
      />
      <WhySection
        question={question}
        answer={answer}
        feedback={whyFeedback}
        onSelect={handleWhySelect}
      />
    </article>
  );
}

export default QuestionCard;
