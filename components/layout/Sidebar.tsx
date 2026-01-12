'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Sparkles, Mail, Plus } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SidebarProps {
  onHomeClick?: () => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
}

// Navigation items (excluding New Conversation which is handled separately)
const navItems = [
  { icon: MessageCircle, label: 'Chat', href: '/chat', tooltip: 'Parla con il sommelier AI' },
  { icon: Sparkles, label: 'Scopri WYN', href: '/about', tooltip: 'Scopri le funzionalità di WYN' },
  { icon: Mail, label: 'Contatti', href: '/contacts', tooltip: 'Attiva WYN per il tuo ristorante' },
]

export function Sidebar({ onHomeClick, isMobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Determine if on chat page
  const isOnChatPage = pathname === '/chat' || pathname.startsWith('/chat')

  const handleLogoClick = (e: React.MouseEvent) => {
    if (onHomeClick) {
      e.preventDefault()
      onHomeClick()
    }
    // Close mobile sidebar when navigating
    onMobileClose?.()
  }

  const handleNewConversation = () => {
    // Always navigate to home page for new conversation
    router.push('/')
    // Close mobile sidebar
    onMobileClose?.()
  }

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    onMobileClose?.()
  }

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            className="fixed inset-0 z-30 bg-black/60 sm:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <aside className={cn(
        "fixed left-0 top-0 z-40 h-screen w-14 sm:w-16 flex flex-col bg-card shadow-[4px_0_12px_rgba(0,0,0,0.2)]",
        // Mobile: hidden by default, shown when open
        "transition-transform duration-200 ease-out",
        "sm:translate-x-0", // Always visible on desktop
        isMobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
      )}>
      {/* Logo - Home button */}
      <div className="flex items-center justify-center pt-5 pb-3">
        <Link
          href="/"
          onClick={handleLogoClick}
          className="focus-visible:outline-none"
        >
          <motion.div
            className="origin-bottom"
            whileHover={{
              skewX: -8,
              filter: 'drop-shadow(0 0 8px rgba(143, 36, 54, 0.6))'
            }}
            whileTap={{
              skewX: -12,
              filter: 'drop-shadow(0 0 12px rgba(143, 36, 54, 0.8))'
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Image
              src="/wyn-icon.ico"
              alt="WYN"
              width={44}
              height={44}
              className="w-11 h-11"
            />
          </motion.div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 py-2">
        {/* New Conversation Button - Always visible */}
        <Tooltip content="Nuova conversazione" side="right">
          <button
            onClick={handleNewConversation}
            className={cn(
              'flex flex-col items-center justify-center',
              'w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg transition-colors relative',
              'hover:bg-secondary btn-press',
              'text-muted-foreground hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
            )}
          >
            <Plus className="h-5 w-5" />
            <span className="text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 relative z-10 text-center leading-tight">Nuovo</span>
          </button>
        </Tooltip>

        {navItems.map((item) => {
          const isActive = item.href === '/chat'
            ? isOnChatPage
            : pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Tooltip key={item.href} content={item.tooltip} side="right">
              <Link
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'w-11 h-11 sm:w-[52px] sm:h-[52px] rounded-lg transition-colors relative',
                  'hover:bg-secondary btn-press',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wine'
                )}
              >
                {/* Active background indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-secondary rounded-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={cn('h-5 w-5 relative z-10', isActive && 'text-wine')} />
                <span className={cn(
                  'text-[10px] sm:text-[11px] mt-0.5 sm:mt-1 relative z-10 text-center leading-tight',
                  isActive && 'text-wine'
                )}>
                  {item.label}
                </span>
              </Link>
            </Tooltip>
          )
        })}
      </nav>

      {/* Footer links */}
      <div className="mt-auto pb-3 flex flex-col items-center gap-1">
        <Link
          href="/privacy"
          onClick={handleNavClick}
          className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Privacy
        </Link>
        <Link
          href="/terms"
          onClick={handleNavClick}
          className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
        >
          Termini
        </Link>
      </div>
    </aside>
    </>
  )
}
