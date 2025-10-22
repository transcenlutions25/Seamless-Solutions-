import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seamless Solutions - Project Management',
  description: 'Modern project management and task tracking solution',
  keywords: ['project management', 'task tracking', 'productivity'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
