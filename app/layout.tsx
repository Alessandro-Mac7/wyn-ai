import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { MainLayout } from '@/components/layout'
import { Providers } from '@/components/Providers'
import { ServiceWorkerRegistration } from '@/components/pwa'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  themeColor: '#8f2436',
  viewportFit: 'cover', // Enable safe area insets for notched devices
  maximumScale: 1,
  minimumScale: 1,
  userScalable: false, // Disable pinch zoom for native app feel
}

export const metadata: Metadata = {
  title: 'WYN - AI Sommelier',
  description: 'Il tuo sommelier AI personale',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'WYN',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-wine focus:text-white focus:rounded-md focus:outline-none"
        >
          Vai al contenuto principale
        </a>
        {/* Service Worker Registration for PWA */}
        <ServiceWorkerRegistration />
        <Providers>
          <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  )
}
