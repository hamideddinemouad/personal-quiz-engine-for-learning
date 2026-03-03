import { appendWishListItem, getDataSafetyState } from '@/server/data-safety/repository';
import { logError } from '@/server/logging';
import type { DataSafetyState } from '@/types/quiz';

const MAX_WISH_LENGTH = 280;
// Guardrail so a wish stays compact enough for sidebar rendering and backup snapshots.

function normalizeWishInput(wish: string): string {
  return wish.trim();
}

export async function getWishListState(): Promise<DataSafetyState> {
  return getDataSafetyState();
}

export async function saveWishListItem(wish: string): Promise<DataSafetyState> {
  const normalizedWish = normalizeWishInput(wish);
  if (!normalizedWish) {
    throw new Error('Wish cannot be empty.');
  }

  if (normalizedWish.length > MAX_WISH_LENGTH) {
    throw new Error(`Wish is too long. Maximum ${MAX_WISH_LENGTH} characters.`);
  }

  try {
    return await appendWishListItem(normalizedWish);
  } catch (error) {
    logError('data_safety.wish.save.failed', error);
    throw error;
  }
}
