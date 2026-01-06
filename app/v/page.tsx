import { redirect } from 'next/navigation'

// Redirect to home page with venue selector open
// The mode=venue param will trigger the venue selector modal
export default function VenueSelectPage() {
  redirect('/?openVenue=true')
}
