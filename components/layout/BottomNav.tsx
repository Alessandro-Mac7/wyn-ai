'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, ScanLine, LogIn, MoreHorizontal, Sparkles, Mail } from 'lucide-react'
import { usePanelContext } from '@/contexts/panel-context'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  onScanPress: () => void
  onProfilePress: () => void
  isAuthenticated: boolean
  userInitial?: string
}

export function BottomNav({ onScanPress, onProfilePress, isAuthenticated, userInitial }: BottomNavProps) {
  const pathname = usePathname()
  const { isPanelOpen } = usePanelContext()
  const [showMore, setShowMore] = useState(false)

  if (isPanelOpen) return null

  const isChat = pathname === '/chat' || pathname.startsWith('/chat/')
  const isAbout = pathname === '/about'
  const isContacts = pathname === '/contacts'
  const isMoreActive = isAbout || isContacts

  return (
    <>
      {/* "Altro" popover */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              className="fixed inset-0 z-40 sm:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
            />
            <motion.div
              className={cn(
                'fixed z-50 sm:hidden',
                'right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))]',
                'w-44 rounded-xl overflow-hidden',
                'glass-ios'
              )}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <Link
                href="/about"
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  isAbout ? 'text-wine' : 'text-foreground hover:bg-white/5'
                )}
              >
                <Sparkles className="h-4 w-4" />
                Scopri WYN
              </Link>
              <div className="h-px bg-white/10" />
              <Link
                href="/contacts"
                onClick={() => setShowMore(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                  isContacts ? 'text-wine' : 'text-foreground hover:bg-white/5'
                )}
              >
                <Mail className="h-4 w-4" />
                Contatti
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <div
        className={cn(
          'fixed bottom-0 inset-x-0 z-40 sm:hidden',
          'flex items-end gap-2',
          'px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]'
        )}
      >
        {/* Floating WYN home button */}
        <Link href="/" className="shrink-0">
          <motion.div
            className="w-12 h-12 rounded-2xl flex items-center justify-center glass-ios"
            animate={{
              scale: [1, 1.06, 1],
              rotate: [0, -5, 5, 0],
            }}
            transition={{
              scale: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
            whileTap={{ scale: 0.88 }}
          >
            <Image
              src="/wyn-icon.ico"
              alt="Home"
              width={30}
              height={30}
              className="w-[30px] h-[30px]"
            />
          </motion.div>
        </Link>

        {/* Glass bar */}
        <nav
          className="flex-1 rounded-2xl glass-ios"
        >
          <div className="flex items-center h-12">
            <Link
              href="/chat"
              className={cn(
                'flex-1 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors',
                isChat ? 'text-wine' : 'text-muted-foreground'
              )}
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Chat</span>
            </Link>

            <button
              onClick={onScanPress}
              className="flex-1 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors text-muted-foreground"
            >
              <ScanLine className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Scansiona</span>
            </button>

            <button
              onClick={onProfilePress}
              className={cn(
                'flex-1 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors',
                isAuthenticated ? 'text-wine' : 'text-muted-foreground'
              )}
            >
              {isAuthenticated ? (
                <>
                  <div className="w-6 h-6 rounded-full bg-wine/20 flex items-center justify-center text-xs font-medium text-wine">
                    {userInitial || 'U'}
                  </div>
                  <span className="text-[10px] mt-0.5">Profilo</span>
                </>
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5">Accedi</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowMore(v => !v)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center min-h-[44px] rounded-lg transition-colors',
                isMoreActive || showMore ? 'text-wine' : 'text-muted-foreground'
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Altro</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  )
}
