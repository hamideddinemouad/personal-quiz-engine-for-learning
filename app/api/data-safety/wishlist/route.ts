import {
  deleteWishListItem,
  getWishListState,
  saveWishListItem
} from '@/server/data-safety/service';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SaveWishRequestBody {
  wish?: unknown;
}

function resolveWishErrorResponse(error: unknown, fallbackMessage: string): { error: string; status: number } {
  if (error instanceof SyntaxError) {
    return {
      error: 'Invalid JSON payload.',
      status: 400
    };
  }

  const message = error instanceof Error ? error.message : fallbackMessage;
  const status = message.includes('too long') || message.includes('empty') ? 400 : 500;
  return { error: message, status };
}

export async function GET(): Promise<Response> {
  try {
    const state = await getWishListState();
    logInfo('api.data_safety.wishlist.get.success', {
      wishCount: state.wishList.length
    });
    return Response.json({
      wishList: state.wishList,
      updatedAt: state.updatedAt
    });
  } catch (error) {
    logError('api.data_safety.wishlist.get.failed', error);
    return Response.json({ error: 'Unable to load wish list.' }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SaveWishRequestBody;
    if (typeof body.wish !== 'string') {
      return Response.json({ error: 'Body must include a string `wish`.' }, { status: 400 });
    }

    const state = await saveWishListItem(body.wish);
    logInfo('api.data_safety.wishlist.post.success', {
      wishCount: state.wishList.length
    });
    return Response.json({
      wishList: state.wishList,
      updatedAt: state.updatedAt
    });
  } catch (error) {
    // We currently use service-layer error message text to classify validation errors
    // (instead of custom error classes) to keep this endpoint lightweight.
    const { error: message, status } = resolveWishErrorResponse(error, 'Unable to save wish list.');
    logError('api.data_safety.wishlist.post.failed', error);
    return Response.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SaveWishRequestBody;
    if (typeof body.wish !== 'string') {
      return Response.json({ error: 'Body must include a string `wish`.' }, { status: 400 });
    }

    const state = await deleteWishListItem(body.wish);
    logInfo('api.data_safety.wishlist.delete.success', {
      wishCount: state.wishList.length
    });
    return Response.json({
      wishList: state.wishList,
      updatedAt: state.updatedAt
    });
  } catch (error) {
    const { error: message, status } = resolveWishErrorResponse(error, 'Unable to delete wish list item.');
    logError('api.data_safety.wishlist.delete.failed', error);
    return Response.json({ error: message }, { status });
  }
}
