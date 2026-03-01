export type FeedbackTone = 'neutral' | 'success' | 'error';
export type ChoiceUiMode = 'standard' | 'flashcards';

export interface FeedbackState {
  text: string;
  tone: FeedbackTone;
}

export const EMPTY_FEEDBACK: FeedbackState = {
  text: '',
  tone: 'neutral'
};
