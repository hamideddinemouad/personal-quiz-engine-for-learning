import QuizApp from '@/features/quiz/components/quiz-app';
import { getStudyStreakStats, getTodayQuizSnapshot } from '@/server/history/service';

export const dynamic = 'force-dynamic';
const DAILY_MASTERED_GOAL = 20;

export default async function FlashPage(): Promise<JSX.Element> {
  const [todaySnapshot, studyStreakStats] = await Promise.all([
    getTodayQuizSnapshot(),
    getStudyStreakStats()
  ]);

  return (
    <QuizApp
      choiceUi="flashcards"
      dailyMasteredGoal={DAILY_MASTERED_GOAL}
      initialDailySnapshotError={todaySnapshot.saveError}
      initialNeedsDailySetup={!todaySnapshot.hasTodayQuiz}
      initialQuizSubject={todaySnapshot.subject}
      initialQuestions={todaySnapshot.questions}
      initialStudyStreakDays={studyStreakStats.currentStreakDays}
    />
  );
}
