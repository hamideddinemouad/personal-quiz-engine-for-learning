'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/quiz', label: 'Normal Quiz' },
  { href: '/flash', label: 'Flashcards' }
] as const;

export default function AppModeNav(): JSX.Element {
  const pathname = usePathname();

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
    </nav>
  );
}
