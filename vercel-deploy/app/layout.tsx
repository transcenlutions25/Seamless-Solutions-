import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Seamless Solutions',
  description: 'A modern web application built with Next.js',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}