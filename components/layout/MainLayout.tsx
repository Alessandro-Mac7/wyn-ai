'use client'

import { usePathname } from 'next/navigation'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()

  // Home page handles its own sidebar and layout
  // Admin pages have their own layout
  // About page uses sidebar via home pattern
  // Venue pages redirect to home with venue param
  const isHomePage = pathname === '/'
  const isAdminPage = pathname.startsWith('/admin')
  const isAboutPage = pathname === '/about'

  // Home page handles everything itself (sidebar + main)
  if (isHomePage) {
    return <>{children}</>
  }

  // Admin pages - no sidebar
  if (isAdminPage) {
    return <>{children}</>
  }

  // About and other pages - simple layout with padding for sidebar
  // (Sidebar is rendered by the page itself if needed)
  return <>{children}</>
}
