export const metadata = {
  title: 'Seamless Solutions',
  description: 'Built with Cursor',
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
