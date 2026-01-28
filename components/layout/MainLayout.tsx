'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
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

  const [showScanPanel, setShowScanPanel] = useState(false)
  const [showLoginPanel, setShowLoginPanel] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)

  const isAuthenticated = userContext?.isAuthenticated ?? false
  const displayName = userContext?.profile?.display_name
  const email = userContext?.user?.email

  const userInitial = displayName
    ? displayName.charAt(0).toUpperCase()
    : email
      ? email.charAt(0).toUpperCase()
      : 'U'

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

  return (
    <>
      <Sidebar />

      <BottomNav
        onScanPress={() => setShowScanPanel(true)}
        onProfilePress={handleProfilePress}
        isAuthenticated={isAuthenticated}
        userInitial={userInitial}
      />

      {children}

      {/* Mobile panels triggered by BottomNav */}
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
