'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileSidebarToggle } from './MobileSidebarToggle'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Determine which pages should have the sidebar
  const isAdminPage = pathname.startsWith('/admin')
  const isInternalPage = pathname.startsWith('/internal')
  const isVenuePage = pathname.startsWith('/v/')

  // Pages that don't use the shared sidebar
  const noSidebar = isAdminPage || isInternalPage || isVenuePage

  // On chat page, toggle is centered; on other pages, it's at the top
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/')
  const togglePosition = isChatPage ? 'center' : 'top'

  // Admin and internal pages handle their own layout
  if (noSidebar) {
    return <>{children}</>
  }

  // All other pages get the shared sidebar and toggle
  return (
    <>
      {/* Mobile sidebar toggle - persists across page navigations for smooth animation */}
      <MobileSidebarToggle
        isOpen={mobileSidebarOpen}
        onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        position={togglePosition}
      />

      {/* Sidebar - persists across page navigations */}
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {children}
    </>
  )
}
