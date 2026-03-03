import { createGithubQuizHistoryBackup } from '@/server/backup/github';
import { logError, logInfo } from '@/server/logging';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function extractHost(request: Request): string | null {
  const forwardedHost = request.headers.get('x-forwarded-host')?.trim();
  if (forwardedHost) {
    return forwardedHost.toLowerCase();
  }

  const host = request.headers.get('host')?.trim();
  return host ? host.toLowerCase() : null;
}

function matchesRequestHost(host: string, candidateUrl: string | null): boolean {
  if (!candidateUrl) {
    return false;
  }

  try {
    return new URL(candidateUrl).host.toLowerCase() === host;
  } catch {
    return false;
  }
}

function isManualUiRequestAuthorized(request: Request): boolean {
  const trigger = request.headers.get('x-backup-ui-trigger')?.trim();
  if (trigger !== '1') {
    return false;
  }

  const host = extractHost(request);
  if (!host) {
    return false;
  }

  return (
    matchesRequestHost(host, request.headers.get('origin')) ||
    matchesRequestHost(host, request.headers.get('referer'))
  );
}

export async function POST(request: Request): Promise<Response> {
  if (!isManualUiRequestAuthorized(request)) {
    logInfo('api.backup.github.manual.unauthorized');
    return Response.json({ error: 'Unauthorized manual backup request.' }, { status: 401 });
  }

  try {
    const result = await createGithubQuizHistoryBackup();

    logInfo('api.backup.github.manual.success', {
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
    logError('api.backup.github.manual.failed', error);
    return Response.json({ error: 'Failed to create GitHub backup.' }, { status: 500 });
  }
}
