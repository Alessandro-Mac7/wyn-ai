import { redirect } from 'next/navigation'
import { checkVenueExists } from '@/lib/supabase'
import { VenueRedirectClient } from './VenueRedirectClient'

interface VenuePageProps {
  params: Promise<{ slug: string }>
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params

  if (!slug) {
    redirect('/chat')
  }

  // Server-side venue validation
  const exists = await checkVenueExists(slug)

  if (!exists) {
    redirect(`/chat?venue_error=${encodeURIComponent(slug)}`)
  }

  // Pass to client component for splash/redirect logic
  return <VenueRedirectClient slug={slug} />
}
