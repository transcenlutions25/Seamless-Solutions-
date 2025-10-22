export const metadata = {
  title: 'Seamless Solutions',
  description: 'Seamless Solutions Application',
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
