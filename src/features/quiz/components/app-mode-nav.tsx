'use client';

import { useEffect, useState } from 'react';
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

interface WishListApiResponse {
  wishList?: string[];
  updatedAt?: string | null;
  error?: string;
}

export default function AppModeNav(): JSX.Element {
  const pathname = usePathname();
  const [isCreatingGithubBackup, setIsCreatingGithubBackup] = useState(false);
  const [backupFeedback, setBackupFeedback] = useState<{
    tone: 'success' | 'error' | 'neutral';
    text: string;
  } | null>(null);
  const [wishInput, setWishInput] = useState('');
  const [wishList, setWishList] = useState<string[]>([]);
  const [wishListUpdatedAt, setWishListUpdatedAt] = useState<string | null>(null);
  const [isLoadingWishList, setIsLoadingWishList] = useState(false);
  const [isSavingWish, setIsSavingWish] = useState(false);
  const [deletingWish, setDeletingWish] = useState<string | null>(null);
  const [isWishListVisible, setIsWishListVisible] = useState(false);
  const [wishFeedback, setWishFeedback] = useState<{
    tone: 'success' | 'error' | 'neutral';
    text: string;
  } | null>(null);

  const loadWishList = async (showErrorFeedback = true): Promise<void> => {
    setIsLoadingWishList(true);

    try {
      const response = await fetch('/api/data-safety/wishlist', {
        cache: 'no-store'
      });
      const payload = (await response.json()) as WishListApiResponse;

      if (!response.ok || !Array.isArray(payload.wishList)) {
        if (showErrorFeedback) {
          setWishFeedback({
            tone: 'error',
            text: payload.error || 'Unable to load wish list.'
          });
        }
        return;
      }

      setWishList(payload.wishList);
      setWishListUpdatedAt(payload.updatedAt ?? null);
    } catch {
      if (showErrorFeedback) {
        setWishFeedback({
          tone: 'error',
          text: 'Network error while loading wish list.'
        });
      }
    } finally {
      setIsLoadingWishList(false);
    }
  };

  useEffect(() => {
    // On initial mount we hydrate local state quietly: no noisy error toast if API is temporarily unavailable.
    void loadWishList(false);
  }, []);

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

  const handleSaveWish = async (): Promise<void> => {
    if (isSavingWish) {
      return;
    }

    const normalizedWish = wishInput.trim();
    if (!normalizedWish) {
      setWishFeedback({
        tone: 'error',
        text: 'Type a wish first.'
      });
      return;
    }

    setIsSavingWish(true);
    setWishFeedback(null);

    try {
      const response = await fetch('/api/data-safety/wishlist', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          wish: normalizedWish
        })
      });
      const payload = (await response.json()) as WishListApiResponse;

      if (!response.ok || !Array.isArray(payload.wishList)) {
        setWishFeedback({
          tone: 'error',
          text: payload.error || 'Unable to save wish.'
        });
        return;
      }

      setWishList(payload.wishList);
      setWishListUpdatedAt(payload.updatedAt ?? null);
      setWishInput('');
      setWishFeedback({
        tone: 'success',
        text: 'Wish saved to database. It will be included in GitHub backups.'
      });
    } catch {
      setWishFeedback({
        tone: 'error',
        text: 'Network error while saving wish.'
      });
    } finally {
      setIsSavingWish(false);
    }
  };

  const handleToggleWishList = (): void => {
    const willShow = !isWishListVisible;
    setIsWishListVisible(willShow);
    if (willShow) {
      // Refresh when opening so the list reflects latest DB data, not only local state.
      void loadWishList();
    }
  };

  const handleDeleteWish = async (wish: string): Promise<void> => {
    if (deletingWish) {
      return;
    }

    setDeletingWish(wish);
    setWishFeedback(null);

    try {
      const response = await fetch('/api/data-safety/wishlist', {
        method: 'DELETE',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          wish
        })
      });
      const payload = (await response.json()) as WishListApiResponse;

      if (!response.ok || !Array.isArray(payload.wishList)) {
        setWishFeedback({
          tone: 'error',
          text: payload.error || 'Unable to delete wish.'
        });
        return;
      }

      setWishList(payload.wishList);
      setWishListUpdatedAt(payload.updatedAt ?? null);
      setWishFeedback({
        tone: 'success',
        text: 'Wish deleted from database.'
      });
    } catch {
      setWishFeedback({
        tone: 'error',
        text: 'Network error while deleting wish.'
      });
    } finally {
      setDeletingWish(null);
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
        <label className="app-mode-nav__wish-field">
          <span className="app-mode-nav__wish-label">Wish list</span>
          <input
            className="history-input app-mode-nav__wish-input"
            onChange={(event) => setWishInput(event.target.value)}
            placeholder="Type one wish to implement later"
            type="text"
            value={wishInput}
          />
        </label>
        <div className="app-mode-nav__wish-actions">
          <button
            className="button button--ghost app-mode-nav__wish-button"
            disabled={isSavingWish}
            onClick={() => {
              void handleSaveWish();
            }}
            type="button"
          >
            {isSavingWish ? 'Saving...' : 'Save Wish'}
          </button>
          <button
            className="button button--ghost app-mode-nav__wish-button"
            onClick={handleToggleWishList}
            type="button"
          >
            {isWishListVisible ? 'Hide Wish List' : 'Show Wish List'}
          </button>
        </div>
        {wishFeedback ? (
          <p className={`feedback feedback--${wishFeedback.tone} app-mode-nav__backup-feedback`}>
            {wishFeedback.text}
          </p>
        ) : null}
        {isWishListVisible ? (
          <div className="app-mode-nav__wish-list-shell">
            {isLoadingWishList ? (
              <p className="muted-text">Loading wishes...</p>
            ) : wishList.length > 0 ? (
              <>
                {wishListUpdatedAt ? (
                  <p className="muted-text">
                    Last updated: {new Date(wishListUpdatedAt).toLocaleString()}
                  </p>
                ) : null}
                <ul className="app-mode-nav__wish-list">
                  {wishList.map((wish) => (
                    <li className="app-mode-nav__wish-item" key={wish}>
                      <span>{wish}</span>
                      <button
                        className="button button--ghost app-mode-nav__wish-delete-button"
                        disabled={Boolean(deletingWish)}
                        onClick={() => {
                          void handleDeleteWish(wish);
                        }}
                        type="button"
                      >
                        {deletingWish === wish ? 'Deleting...' : 'Delete'}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="muted-text">No wishes saved yet.</p>
            )}
          </div>
        ) : null}
      </div>
    </nav>
  );
}
