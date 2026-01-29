'use client'

import { useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { LoginPanel } from '@/components/auth/LoginPanel'
import { ProfileModal } from '@/components/auth/ProfileModal'
import { ScanPanel } from '@/components/scan/ScanPanel'
import { useUserOptional } from '@/contexts/user-context'
import { useUserInitial } from '@/hooks/useUserInitial'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const userContext = useUserOptional()
  const userInitial = useUserInitial()

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

  const handleProfilePress = () => {
    if (isAuthenticated) {
      setShowProfileModal(true)
    } else {
      setShowLoginPanel(true)
    }
  }

  const handleOpenScan = () => setShowScanPanel(true)
  const handleOpenLogin = () => setShowLoginPanel(true)
  const handleOpenProfile = () => setShowProfileModal(true)

  return (
    <>
      <Sidebar
        onOpenScan={handleOpenScan}
        onOpenLogin={handleOpenLogin}
        onOpenProfile={handleOpenProfile}
      />

      <BottomNav
        onScanPress={handleOpenScan}
        onProfilePress={handleProfilePress}
        isAuthenticated={isAuthenticated}
        userInitial={userInitial}
      />

      {children}

      {/* Shared panels — single instances for both mobile and desktop triggers */}
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
