export type FeedbackTone = 'neutral' | 'success' | 'error';

export interface FeedbackState {
  text: string;
  tone: FeedbackTone;
}

export const EMPTY_FEEDBACK: FeedbackState = {
  text: '',
  tone: 'neutral'
};
