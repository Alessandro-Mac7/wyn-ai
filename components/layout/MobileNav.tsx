'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle,
  ScanLine,
  LogIn,
  X,
  Sparkles,
  Mail,
  MoreHorizontal,
} from 'lucide-react'
import { usePanelContext } from '@/contexts/panel-context'
import { cn } from '@/lib/utils'

interface MobileNavProps {
  onProfilePress: () => void
  isAuthenticated: boolean
  userInitial?: string
}

import { panelSlideVariants, backdropVariants } from '@/lib/motion'

export function MobileNav({ onProfilePress, isAuthenticated, userInitial }: MobileNavProps) {
  const pathname = usePathname()
  const { isPanelOpen } = usePanelContext()
  const [isOpen, setIsOpen] = useState(false)

  // Hide when another panel is open
  if (isPanelOpen) return null

  const isHome = pathname === '/'
  const isChat = pathname === '/chat' || pathname.startsWith('/chat/')
  const isScan = pathname === '/scan'
  const isAbout = pathname === '/about'
  const isContacts = pathname === '/contacts'

  const close = () => setIsOpen(false)

  const handleProfilePress = () => {
    close()
    onProfilePress()
  }

  return (
    <>
      {/* Toggle button — top-right, below status bar */}
      <div className="fixed top-0 right-0 z-40 sm:hidden safe-top p-3">
        <motion.button
          onClick={() => setIsOpen(v => !v)}
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center',
            'glass-ios',
            isOpen && 'bg-wine/20'
          )}
          whileTap={{ scale: 0.9 }}
          aria-label={isOpen ? 'Chiudi menu' : 'Apri menu'}
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <MoreHorizontal className="h-5 w-5 text-foreground" />
          )}
        </motion.button>
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-[45] glass-backdrop sm:hidden"
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={close}
            />

            {/* Panel */}
            <motion.nav
              className={cn(
                'fixed top-0 bottom-0 right-0 z-[45] sm:hidden',
                'w-64 max-w-[80vw]',
                'glass-panel',
                'flex flex-col safe-top'
              )}
              variants={panelSlideVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Logo header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.08]">
                <Image
                  src="/wyn-icon.ico"
                  alt="WYN"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="font-semibold text-lg">WYN</span>
              </div>

              {/* Nav items */}
              <div className="flex-1 flex flex-col gap-1 px-3 py-4">
                <NavItem
                  href="/"
                  icon={
                    <Image
                      src="/wyn-icon.ico"
                      alt=""
                      width={20}
                      height={20}
                      className="w-5 h-5"
                    />
                  }
                  label="Home"
                  active={isHome}
                  onClick={close}
                />
                <NavItem
                  href="/chat"
                  icon={<MessageCircle className="h-5 w-5" />}
                  label="Chat"
                  active={isChat}
                  onClick={close}
                />
                <NavItem
                  href="/scan"
                  icon={<ScanLine className="h-5 w-5" />}
                  label="Scansiona"
                  active={isScan}
                  onClick={close}
                />

                <div className="h-px bg-white/[0.08] my-2" />

                <NavItem
                  href="/about"
                  icon={<Sparkles className="h-5 w-5" />}
                  label="Scopri WYN"
                  active={isAbout}
                  onClick={close}
                />
                <NavItem
                  href="/contacts"
                  icon={<Mail className="h-5 w-5" />}
                  label="Contatti"
                  active={isContacts}
                  onClick={close}
                />
              </div>

              {/* Bottom: Accedi / Profilo */}
              <div className="px-3 py-4 border-t border-white/[0.08] safe-bottom">
                {isAuthenticated ? (
                  <button
                    onClick={handleProfilePress}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                      'transition-colors glass-hover text-wine'
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-wine/20 flex items-center justify-center text-sm font-medium">
                      {userInitial || 'U'}
                    </div>
                    <span className="text-sm font-medium">Profilo</span>
                  </button>
                ) : (
                  <button
                    onClick={handleProfilePress}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-3 rounded-xl',
                      'transition-colors glass-hover text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <LogIn className="h-5 w-5" />
                    <span className="text-sm font-medium">Accedi</span>
                  </button>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function NavItem({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
        active
          ? 'bg-wine/10 text-wine'
          : 'text-muted-foreground glass-hover hover:text-foreground'
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}
