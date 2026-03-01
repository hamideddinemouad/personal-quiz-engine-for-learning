import QuizApp from '@/features/quiz/components/quiz-app';
import { getOrCreateTodayQuizSnapshot, getStudyStreakStats } from '@/server/history/service';

export const dynamic = 'force-dynamic';
const DAILY_MASTERED_GOAL = 20;

export default function HomePage(): JSX.Element {
  const questions = getOrCreateTodayQuizSnapshot();
  const studyStreakStats = getStudyStreakStats();

  return (
    <QuizApp
      dailyMasteredGoal={DAILY_MASTERED_GOAL}
      initialQuestions={questions}
      initialStudyStreakDays={studyStreakStats.currentStreakDays}
    />
  );
}
