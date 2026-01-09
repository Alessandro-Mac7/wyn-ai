'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

interface PanelContextType {
  isPanelOpen: boolean
  registerPanel: (id: string) => void
  unregisterPanel: (id: string) => void
}

const PanelContext = createContext<PanelContextType>({
  isPanelOpen: false,
  registerPanel: () => {},
  unregisterPanel: () => {},
})

export function PanelProvider({ children }: { children: ReactNode }) {
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set())

  const registerPanel = useCallback((id: string) => {
    setOpenPanels(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const unregisterPanel = useCallback((id: string) => {
    setOpenPanels(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  return (
    <PanelContext.Provider value={{
      isPanelOpen: openPanels.size > 0,
      registerPanel,
      unregisterPanel,
    }}>
      {children}
    </PanelContext.Provider>
  )
}

export function usePanelContext() {
  return useContext(PanelContext)
}

// Hook to register a panel - call with isOpen state
export function useRegisterPanel(id: string, isOpen: boolean) {
  const { registerPanel, unregisterPanel } = usePanelContext()

  useEffect(() => {
    if (isOpen) {
      registerPanel(id)
    } else {
      unregisterPanel(id)
    }

    return () => unregisterPanel(id)
  }, [id, isOpen, registerPanel, unregisterPanel])
}
