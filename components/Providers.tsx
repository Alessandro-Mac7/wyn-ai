'use client'

import { SessionProvider } from '@/contexts/session-context'
import { PanelProvider } from '@/contexts/panel-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Admin pages use useAdminSession directly (no global provider needed)
  // SessionProvider is for chat session state only
  // PanelProvider tracks open slide-in panels for z-index coordination
  // ErrorBoundary wraps everything for graceful error handling
  return (
    <ErrorBoundary>
      <PanelProvider>
        <SessionProvider>{children}</SessionProvider>
      </PanelProvider>
    </ErrorBoundary>
  )
}
