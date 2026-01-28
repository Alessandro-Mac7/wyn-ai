'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wine, MapPin, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ChatSessionWithVenue } from '@/hooks/useChatHistory'
import { formatRelativeTime } from '@/hooks/useChatHistory'

interface ChatHistoryItemProps {
  session: ChatSessionWithVenue
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

export function ChatHistoryItem({
  session,
  isActive,
  onClick,
  onDelete,
}: ChatHistoryItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Determine display text
  const topic = session.summary?.topic || 'Conversazione'
  const venueName = session.venue?.name
  const relativeTime = formatRelativeTime(session.created_at)

  // Truncate topic if too long
  const displayTopic = topic.length > 30 ? topic.slice(0, 27) + '...' : topic

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)
    await onDelete()
    // Component will be removed by parent after animation
  }

  return (
    <motion.button
      className={cn(
        'w-full text-left px-3 py-2 rounded-lg transition-colors relative group',
        'hover:bg-white/5',
        isActive && 'bg-wine/20 border-l-2 border-wine',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10, height: 0 }}
      transition={{ duration: 0.15 }}
      layout
    >
      {/* Icon */}
      <div className="flex items-start gap-2">
        <div className={cn(
          'shrink-0 mt-0.5',
          isActive ? 'text-wine' : 'text-muted-foreground'
        )}>
          {venueName ? (
            <MapPin className="w-4 h-4" />
          ) : (
            <Wine className="w-4 h-4" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'text-sm font-medium truncate',
            isActive && 'text-wine'
          )}>
            {displayTopic}
          </p>

          {/* Venue name or timestamp */}
          <p className="text-xs text-muted-foreground truncate">
            {venueName ? (
              <span className="flex items-center gap-1">
                <span className="truncate">{venueName}</span>
                <span className="text-white/30">·</span>
                <span>{relativeTime}</span>
              </span>
            ) : (
              relativeTime
            )}
          </p>
        </div>
      </div>

      {/* Delete button - appears on hover */}
      <motion.button
        className={cn(
          'absolute right-2 top-1/2 -translate-y-1/2',
          'p-1.5 rounded-md transition-colors',
          'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
          'opacity-0 group-hover:opacity-100 focus:opacity-100'
        )}
        onClick={handleDelete}
        initial={false}
        animate={{ opacity: isHovered ? 1 : 0 }}
        aria-label="Elimina conversazione"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </motion.button>
    </motion.button>
  )
}
