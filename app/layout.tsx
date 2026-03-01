import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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
      <body>{children}</body>
    </html>
  );
}
