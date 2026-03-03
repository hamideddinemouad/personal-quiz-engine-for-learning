import { createGithubQuizHistoryBackup } from '@/server/backup/github';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorizedRequest(request: Request): boolean {
  const expectedSecret = process.env.CRON_SECRET?.trim();
  if (!expectedSecret) {
    return false;
  }

  const authorization = request.headers.get('authorization')?.trim();
  if (authorization === `Bearer ${expectedSecret}`) {
    return true;
  }

  const backupSecret = request.headers.get('x-backup-secret')?.trim();
  return backupSecret === expectedSecret;
}

export async function GET(request: Request): Promise<Response> {
  if (!isAuthorizedRequest(request)) {
    logInfo('api.backup.github.unauthorized');
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const result = await createGithubQuizHistoryBackup();
    logInfo('api.backup.github.success', {
      filePath: result.filePath,
      rowCount: result.rowCount,
      commitSha: result.commitSha
    });

    return Response.json({
      success: true,
      filePath: result.filePath,
      rowCount: result.rowCount,
      commitSha: result.commitSha
    });
  } catch (error) {
    logError('api.backup.github.failed', error);
    return Response.json({ error: 'Failed to create GitHub backup.' }, { status: 500 });
  }
}
