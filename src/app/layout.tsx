import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Our Book of Firsts',
  description: 'A year of firsts together.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
