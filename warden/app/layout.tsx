import type { Metadata, Viewport } from 'next';
import { HexclaveProvider, HexclaveTheme } from '@hexclave/next';
import { AUTH_ENABLED, hexclaveApp } from '@/hexclave/server';
import './globals.css';

/*
 * System fonts only. A webfont fetch at build time is an unforced error, and the
 * report route needs Georgia regardless.
 */

export const metadata: Metadata = {
  title: 'Warden Security Operations',
  description: 'AI security operations for real estate portfolios.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0c0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const app = AUTH_ENABLED ? hexclaveApp() : null;

  return (
    <html lang="en">
      <body>
        {app ? (
          <HexclaveProvider app={app}>
            <HexclaveTheme>{children}</HexclaveTheme>
          </HexclaveProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
