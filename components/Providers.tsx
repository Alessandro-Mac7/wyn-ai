'use client'

import { SessionProvider } from '@/contexts/session-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Admin pages use useAdminSession directly (no global provider needed)
  // SessionProvider is for chat session state only
  // ErrorBoundary wraps everything for graceful error handling
  return (
    <ErrorBoundary>
      <SessionProvider>{children}</SessionProvider>
    </ErrorBoundary>
  )
}
