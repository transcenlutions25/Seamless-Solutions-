import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Seamless Solutions',
  description: 'Unified hub for service-based businesses to get leads, manage customers, calculate AI-assisted bids, and more.',
  keywords: ['CRM', 'lead management', 'bidding', 'invoicing', 'scheduling', 'marketing automation'],
  authors: [{ name: 'Seamless Solutions Team' }],
  creator: 'Seamless Solutions',
  publisher: 'Seamless Solutions',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Seamless Solutions',
    description: 'Unified hub for service-based businesses to get leads, manage customers, calculate AI-assisted bids, and more.',
    siteName: 'Seamless Solutions',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Seamless Solutions',
    description: 'Unified hub for service-based businesses to get leads, manage customers, calculate AI-assisted bids, and more.',
    creator: '@seamlesssolutions',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
