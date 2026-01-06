import { redirect } from 'next/navigation'

interface VenuePageProps {
  params: Promise<{
    slug: string
  }>
}

// Redirect venue URLs (e.g., QR code scans) to chat with venue
export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params

  // Redirect to chat with venue slug
  // The chat page will load the venue into session and clear the URL param
  redirect(`/chat?venue=${encodeURIComponent(slug)}`)
}
