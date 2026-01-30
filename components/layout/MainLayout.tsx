'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { MobileSidebarToggle } from './MobileSidebarToggle'
import { LoginPanel } from '@/components/auth/LoginPanel'
import { ProfileModal } from '@/components/auth/ProfileModal'
import { ScanPanel } from '@/components/scan/ScanPanel'
import { useUserOptional } from '@/contexts/user-context'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const userContext = useUserOptional()

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showScanPanel, setShowScanPanel] = useState(false)
  const [showLoginPanel, setShowLoginPanel] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const isAuthenticated = userContext?.isAuthenticated ?? false

  // Pages that don't use the shared sidebar
  const isAdminPage = pathname.startsWith('/admin')
  const isInternalPage = pathname.startsWith('/internal')
  const isVenuePage = pathname.startsWith('/v/')
  const noSidebar = isAdminPage || isInternalPage || isVenuePage

  if (noSidebar) {
    return <>{children}</>
  }

  // On chat page, toggle is centered; on other pages, it's at the top
  const isChatPage = pathname === '/chat' || pathname.startsWith('/chat/')
  const togglePosition = isChatPage ? 'center' : 'top'

  const handleOpenScan = () => setShowScanPanel(true)
  const handleOpenLogin = () => setShowLoginPanel(true)
  const handleOpenProfile = () => setShowProfileModal(true)

  return (
    <>
      {/* Mobile sidebar toggle — WYN icon on left edge */}
      <MobileSidebarToggle
        isOpen={mobileSidebarOpen}
        onToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        position={togglePosition}
      />

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <Sidebar
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onOpenScan={handleOpenScan}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={handleOpenProfile}
      />

      {children}

      {/* Shared panels */}
      <ScanPanel
        isOpen={showScanPanel}
        onClose={() => setShowScanPanel(false)}
      />
      <LoginPanel
        isOpen={showLoginPanel}
        onClose={() => setShowLoginPanel(false)}
      />
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  )
}
