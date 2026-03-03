'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/quiz', label: 'Normal Quiz' },
  { href: '/flash', label: 'Flashcards' }
] as const;

interface BackupApiResponse {
  success?: boolean;
  filePath?: string;
  rowCount?: number;
  commitSha?: string | null;
  error?: string;
}

export default function AppModeNav(): JSX.Element {
  const pathname = usePathname();
  const [isCreatingGithubBackup, setIsCreatingGithubBackup] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{
    tone: 'success' | 'error' | 'neutral';
    text: string;
  } | null>(null);

  const handleCreateGithubBackup = async (): Promise<void> => {
    if (isCreatingGithubBackup) {
      return;
    }

    setIsCreatingGithubBackup(true);
    setBackupFeedback(null);

    try {
      const response = await fetch('/api/backup/github/manual', {
        method: 'POST',
        headers: {
          'x-backup-ui-trigger': '1'
        }
      });

      const payload = (await response.json()) as BackupApiResponse;
      if (!response.ok || !payload.success) {
        setBackupFeedback({
          tone: 'error',
          text: payload.error || 'Unable to create GitHub backup.'
        });
        return;
      }

      const shortCommit = payload.commitSha ? payload.commitSha.slice(0, 7) : 'n/a';
      setBackupFeedback({
        tone: 'success',
        text: `Backup created: ${payload.rowCount ?? 0} rows (commit ${shortCommit}).`
      });
    } catch {
      setBackupFeedback({
        tone: 'error',
        text: 'Network error while creating GitHub backup.'
      });
    } finally {
      setIsCreatingGithubBackup(false);
    }
  };

  return (
    <nav aria-label="Quiz mode navigation" className="app-mode-nav">
      <p className="app-mode-nav__eyebrow">Mode</p>
      <h2 className="app-mode-nav__title">Learning View</h2>
      <div className="app-mode-nav__links">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`app-mode-link ${isActive ? 'app-mode-link--active' : ''}`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <div className="app-mode-nav__backup">
        <p className="app-mode-nav__backup-label">Data safety</p>
        <button
          className="button button--ghost app-mode-nav__backup-button"
          disabled={isCreatingGithubBackup}
          onClick={() => {
            void handleCreateGithubBackup();
          }}
          type="button"
        >
          {isCreatingGithubBackup ? 'Creating GitHub Backup...' : 'Create GitHub Backup'}
        </button>
        {backupFeedback ? (
          <p className={`feedback feedback--${backupFeedback.tone} app-mode-nav__backup-feedback`}>
            {backupFeedback.text}
          </p>
        ) : null}
      </div>
    </nav>
  );
}
