import { getDbPool } from '@/server/db/client';
import { logDebug, logError } from '@/server/logging';
import type { DataSafetyState } from '@/types/quiz';

// We intentionally model data safety as one singleton row (key = "main"),
// not one row per wish item.
const DATA_SAFETY_SINGLETON_KEY = 'main';

type DataSafetyRow = {
  singleton_key: string;
  updated_at: string | null;
  wish_list_json: unknown;
};

function normalizeWishText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeWishList(rawValue: unknown): string[] {
  let candidateItems: unknown[] = [];

  if (Array.isArray(rawValue)) {
    candidateItems = rawValue;
  } else if (typeof rawValue === 'string') {
    // Some adapters/proxies may return JSONB as text; this fallback keeps reads resilient.
    try {
      const parsed = JSON.parse(rawValue) as unknown;
      candidateItems = Array.isArray(parsed) ? parsed : [];
    } catch {
      candidateItems = [];
    }
  }

  const deduped = new Set<string>();
  candidateItems.forEach((item) => {
    const normalized = normalizeWishText(item);
    if (normalized) {
      // Set gives us de-duplication while keeping insertion order for display.
      deduped.add(normalized);
    }
  });

  return [...deduped];
}

function mapRowToState(row: DataSafetyRow | undefined): DataSafetyState {
  if (!row) {
    return {
      wishList: [],
      updatedAt: null
    };
  }

  return {
    wishList: normalizeWishList(row.wish_list_json),
    updatedAt: row.updated_at && row.updated_at.trim() ? row.updated_at : null
  };
}

export async function getDataSafetyState(): Promise<DataSafetyState> {
  const pool = await getDbPool();

  try {
    const result = await pool.query<DataSafetyRow>(
      `
        SELECT singleton_key, updated_at, wish_list_json
        FROM data_safety_state
        WHERE singleton_key = $1
        LIMIT 1;
      `,
      [DATA_SAFETY_SINGLETON_KEY]
    );

    return mapRowToState(result.rows[0]);
  } catch (error) {
    logError('data_safety.get.failed', error);
    throw error;
  }
}

export async function appendWishListItem(wish: string): Promise<DataSafetyState> {
  const normalizedWish = normalizeWishText(wish);
  if (!normalizedWish) {
    throw new Error('Wish cannot be empty.');
  }

  const pool = await getDbPool();
  // Read-merge-write is simple and sufficient for this low-traffic admin-style input.
  const currentState = await getDataSafetyState();
  const nextWishList = currentState.wishList.includes(normalizedWish)
    ? currentState.wishList
    : [...currentState.wishList, normalizedWish];
  const updatedAt = new Date().toISOString();

  try {
    const upsertResult = await pool.query<DataSafetyRow>(
      `
        INSERT INTO data_safety_state (singleton_key, updated_at, wish_list_json)
        VALUES ($1, $2, $3::jsonb)
        ON CONFLICT (singleton_key) DO UPDATE SET
          updated_at = excluded.updated_at,
          wish_list_json = excluded.wish_list_json
        RETURNING singleton_key, updated_at, wish_list_json;
      `,
      [DATA_SAFETY_SINGLETON_KEY, updatedAt, JSON.stringify(nextWishList)]
    );

    logDebug('data_safety.wish.append.success', {
      wishCount: nextWishList.length
    });

    return mapRowToState(upsertResult.rows[0]);
  } catch (error) {
    logError('data_safety.wish.append.failed', error);
    throw error;
  }
}
