import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Helmet Detection & License Plate Recognition',
  description: 'AI-powered helmet detection and automatic license plate recognition system',
  viewport: 'width=device-width, initial-scale=1',
}

export const viewport: Viewport = {
  themeColor: '#1e40af',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
