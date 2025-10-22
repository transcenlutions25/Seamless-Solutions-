import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Seamless Solutions',
  description: 'Modern web application built with Next.js and TypeScript',
  keywords: ['Next.js', 'React', 'TypeScript', 'Web Development'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}