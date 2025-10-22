import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Seamless Solutions',
  description: 'Unified hub for service businesses',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
