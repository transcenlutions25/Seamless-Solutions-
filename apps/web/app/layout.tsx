import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Seamless Solutions - Service Business Management Platform',
  description: 'Unified hub for service-based businesses to manage leads, customers, quotes, jobs, and payments.',
  keywords: 'service business, CRM, job management, invoicing, scheduling',
  authors: [{ name: 'Seamless Solutions' }],
  openGraph: {
    title: 'Seamless Solutions',
    description: 'Service Business Management Platform',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}