import type { ReactNode } from 'react';

export const metadata = {
  title: 'Seamless Solutions',
  description: 'Next.js app',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
