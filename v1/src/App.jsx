import QuizEngine from './components/QuizEngine';
import { QuizProvider } from './context/QuizContext';
import { questions } from './data/questions';

function App() {
  return (
    // Global quiz state lives in context so all components read/write
    // from one source of truth (question card, sidebar, header progress).
    <QuizProvider questions={questions}>
      <QuizEngine />
    </QuizProvider>
  );
}

export default App;
