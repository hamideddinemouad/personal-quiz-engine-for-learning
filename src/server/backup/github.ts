import { getWishListState } from '@/server/data-safety/service';
import { getDailyQuizHistory } from '@/server/history/service';

interface GithubBackupConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  baseDir: string;
}

interface GithubCreateFileResponse {
  content?: {
    path?: string;
    sha?: string;
  };
  commit?: {
    sha?: string;
  };
}

export interface GithubBackupResult {
  filePath: string;
  fileSha: string | null;
  commitSha: string | null;
  rowCount: number;
}

interface QuizHistoryBackupPayload {
  // Bumped from v1 because we now include a separate `dataSafety` section.
  schemaVersion: 2;
  generatedAt: string;
  rowCount: number;
  history: unknown[];
  dataSafety: {
    wishCount: number;
    updatedAt: string | null;
    wishList: string[];
  };
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function resolveConfig(): GithubBackupConfig {
  return {
    token: requireEnv('BACKUP_GITHUB_TOKEN'),
    owner: requireEnv('BACKUP_GITHUB_OWNER'),
    repo: requireEnv('BACKUP_GITHUB_REPO'),
    branch: process.env.BACKUP_GITHUB_BRANCH?.trim() || 'main',
    baseDir: process.env.BACKUP_GITHUB_DIR?.trim() || 'quiz-backups'
  };
}

function toTimestampParts(now: Date): { year: string; month: string; day: string; stamp: string } {
  const iso = now.toISOString();
  return {
    year: iso.slice(0, 4),
    month: iso.slice(5, 7),
    day: iso.slice(8, 10),
    stamp: iso.replaceAll(':', '-').replaceAll('.', '-')
  };
}

function buildBackupFilePath(baseDir: string, now: Date): string {
  const { year, month, day, stamp } = toTimestampParts(now);
  return `${baseDir}/${year}/${month}/${day}/quiz-history-${stamp}.json`;
}

function encodePath(path: string): string {
  return path
    .split('/')
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

async function uploadJsonSnapshot(
  config: GithubBackupConfig,
  path: string,
  payload: QuizHistoryBackupPayload
): Promise<GithubBackupResult> {
  const contentBase64 = Buffer.from(JSON.stringify(payload, null, 2), 'utf8').toString('base64');
  const encodedPath = encodePath(path);
  const response = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(config.owner)}/${encodeURIComponent(config.repo)}/contents/${encodedPath}`,
    {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'personal-quiz-engine-backup',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      body: JSON.stringify({
        message: `backup: quiz history ${path}`,
        content: contentBase64,
        branch: config.branch
      })
    }
  );

  const rawBody = await response.text();
  if (!response.ok) {
    throw new Error(
      `GitHub upload failed (${response.status} ${response.statusText}): ${rawBody.slice(0, 300)}`
    );
  }

  const parsedBody = JSON.parse(rawBody) as GithubCreateFileResponse;
  return {
    filePath: path,
    fileSha: parsedBody.content?.sha ?? null,
    commitSha: parsedBody.commit?.sha ?? null,
    rowCount: payload.rowCount
  };
}

export async function createGithubQuizHistoryBackup(now: Date = new Date()): Promise<GithubBackupResult> {
  const config = resolveConfig();
  const [history, wishListState] = await Promise.all([getDailyQuizHistory(), getWishListState()]);
  const filePath = buildBackupFilePath(config.baseDir, now);

  return uploadJsonSnapshot(config, filePath, {
    schemaVersion: 2,
    generatedAt: now.toISOString(),
    rowCount: history.length,
    history,
    dataSafety: {
      wishCount: wishListState.wishList.length,
      updatedAt: wishListState.updatedAt,
      wishList: wishListState.wishList
    }
  });
}
