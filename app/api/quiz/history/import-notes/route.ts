import { importNoteQuizzesIntoHistory } from '@/server/history/note-quiz-import';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(): Promise<Response> {
  try {
    const result = await importNoteQuizzesIntoHistory();

    logInfo('api.history.import_notes.post.success', {
      total: result.total,
      createdCount: result.createdCount,
      skippedCount: result.skippedCount
    });

    return Response.json(result);
  } catch (error) {
    logError('api.history.import_notes.post.failed', error);
    return Response.json({ error: 'Unable to import notes into quiz history.' }, { status: 500 });
  }
}
