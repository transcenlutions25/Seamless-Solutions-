import type { ReactNode } from 'react'

export const metadata = {
  title: 'Seamless Solutions',
  description: 'Next.js deploy check',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
