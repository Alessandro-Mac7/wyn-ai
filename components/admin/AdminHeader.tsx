'use client'

import Link from 'next/link'
import { Wine, LogOut, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminHeaderProps {
  venueName?: string
  venueSlug?: string
  onLogout: () => void
}

export function AdminHeader({
  venueName,
  venueSlug,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wine className="h-8 w-8 text-primary" />
          <div>
            <h1 className="mina-regular text-lg">WINEBOARD</h1>
            {venueName && (
              <p className="text-sm text-muted-foreground">{venueName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {venueSlug && (
            <Link href={`/v/${venueSlug}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Vedi Menu
              </Button>
            </Link>
          )}
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </Button>
        </div>
      </div>
    </header>
  )
}
