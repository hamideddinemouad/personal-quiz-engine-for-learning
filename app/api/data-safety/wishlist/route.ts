import { getWishListState, saveWishListItem } from '@/server/data-safety/service';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SaveWishRequestBody {
  wish?: unknown;
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
    if (error instanceof SyntaxError) {
      return Response.json({ error: 'Invalid JSON payload.' }, { status: 400 });
    }

    // We currently use service-layer error message text to classify validation errors
    // (instead of custom error classes) to keep this endpoint lightweight.
    const message = error instanceof Error ? error.message : 'Unable to save wish list.';
    const status = message.includes('too long') || message.includes('empty') ? 400 : 500;

    logError('api.data_safety.wishlist.post.failed', error);
    return Response.json({ error: message }, { status });
  }
}
