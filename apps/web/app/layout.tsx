import { ReactNode } from 'react';

export const metadata = {
  title: 'Seamless Solutions',
  description: 'Professional development services',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head />
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}