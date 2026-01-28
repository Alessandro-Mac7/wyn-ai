'use client'

import { SessionProvider } from '@/contexts/session-context'
import { PanelProvider } from '@/contexts/panel-context'
import { UserProvider } from '@/contexts/user-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Admin pages use useAdminSession directly (no global provider needed)
  // SessionProvider is for chat session state only
  // PanelProvider tracks open slide-in panels for z-index coordination
  // UserProvider manages user authentication and profile state
  // ErrorBoundary wraps everything for graceful error handling
  return (
    <ErrorBoundary>
      <UserProvider>
        <PanelProvider>
          <SessionProvider>{children}</SessionProvider>
        </PanelProvider>
      </UserProvider>
    </ErrorBoundary>
  )
}
