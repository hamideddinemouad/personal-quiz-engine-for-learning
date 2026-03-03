import QuizApp from '@/features/quiz/components/quiz-app';
import { getOrCreateTodayQuizSnapshot, getStudyStreakStats } from '@/server/history/service';

export const dynamic = 'force-dynamic';
const DAILY_MASTERED_GOAL = 20;

export default function FlashPage(): JSX.Element {
  const todaySnapshot = getOrCreateTodayQuizSnapshot();
  const studyStreakStats = getStudyStreakStats();

  return (
    <QuizApp
      choiceUi="flashcards"
      dailyMasteredGoal={DAILY_MASTERED_GOAL}
      initialDailySnapshotError={todaySnapshot.saveError}
      initialQuestions={todaySnapshot.questions}
      initialStudyStreakDays={studyStreakStats.currentStreakDays}
    />
  );
}
