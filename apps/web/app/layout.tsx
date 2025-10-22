import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seamless Solutions',
  description: 'Your modern solution platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}