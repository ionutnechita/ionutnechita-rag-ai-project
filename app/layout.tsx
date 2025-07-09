import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAG AI Agent',
  description: 'RAG AI Agent',
  generator: 'nextjs',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
