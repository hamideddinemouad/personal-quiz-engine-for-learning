import type { QuizOption, QuizQuestion } from '@/types/quiz';

export function shuffleArray<T>(values: T[]): T[] {
  const shuffled = [...values];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled;
}

export function cloneOption(option: QuizOption): QuizOption {
  return { ...option };
}

export function cloneQuestion(question: QuizQuestion): QuizQuestion {
  return {
    ...question,
    options: question.options.map(cloneOption),
    whyOptions: question.whyOptions?.map(cloneOption)
  };
}

export function cloneQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map(cloneQuestion);
}

export function shuffleQuestionChoices(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((question) => ({
    ...question,
    options: shuffleArray(question.options),
    whyOptions: question.whyOptions ? shuffleArray(question.whyOptions) : undefined
  }));
}
