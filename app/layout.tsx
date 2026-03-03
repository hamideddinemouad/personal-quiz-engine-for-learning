import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import AppModeNav from '@/features/quiz/components/app-mode-nav';
import './globals.css';

export const metadata: Metadata = {
  title: 'Personal Quiz Engine (Next.js)',
  description:
    'Two-phase quiz engine in Next.js + TypeScript with SQLite-backed daily quiz history.'
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps): JSX.Element {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <aside className="app-shell-sidebar card-surface">
            <AppModeNav />
          </aside>
          <div className="app-shell-main">{children}</div>
        </div>
      </body>
    </html>
  );
}
