import { useQuizContext } from '../context/QuizContext';
import QuestionCard from './QuestionCard';
import SidebarNavigation from './SidebarNavigation';

function QuizEngine() {
  // Pull only the state/actions needed at this layout level.
  const { currentQuestion } = useQuizContext();

  if (!currentQuestion) {
    return <p className="p-6 text-slate-300">No questions available.</p>;
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-8 font-[Inter,system-ui,sans-serif] text-slate-100 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-label="Quiz content" className="space-y-4">
          {/* key forces local QuestionCard UI state (feedback/hint visibility) to reset per question */}
          <QuestionCard key={currentQuestion.id} question={currentQuestion} />
        </section>
        <SidebarNavigation />
      </div>
    </main>
  );
}

export default QuizEngine;
