'use client'

import { useSession } from '@/contexts/session-context'
import { useChat } from '@/hooks/useChat'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { QuickSuggestions } from './QuickSuggestions'
import { GENERAL_SUGGESTIONS, VENUE_SUGGESTIONS } from '@/lib/prompts'

interface ChatContainerProps {
  venueName?: string
}

export function ChatContainer({ venueName }: ChatContainerProps) {
  const { venueSlug } = useSession()
  const { messages, isLoading, error, sendMessage } = useChat()

  const suggestions = venueSlug ? VENUE_SUGGESTIONS : GENERAL_SUGGESTIONS

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <QuickSuggestions
            suggestions={suggestions}
            onSelect={sendMessage}
            disabled={isLoading}
          />
        ) : (
          <ChatMessages messages={messages} isLoading={isLoading} />
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="px-4 py-2 text-sm text-red-400 bg-red-900/20">
          {error}
        </div>
      )}

      {/* Input area */}
      <ChatInput
        onSend={sendMessage}
        isLoading={isLoading}
        hasError={!!error}
        placeholder={
          venueSlug
            ? `Chiedimi dei vini di ${venueName || 'questo ristorante'}...`
            : 'Chiedimi qualsiasi cosa sul vino...'
        }
      />
    </div>
  )
}
