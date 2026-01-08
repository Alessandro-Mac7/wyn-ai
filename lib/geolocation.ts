// ============================================
// Geolocation Utilities
// ============================================

// Policy: Maximum distance in km for venue selection
export const MAX_VENUE_DISTANCE_KM = 50

// Default search radius in km
export const DEFAULT_SEARCH_RADIUS_KM = 10

// Haversine formula to calculate distance between two points on Earth
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers

  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in kilometers
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

// Format distance for display
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`
  }
  return `${distanceKm.toFixed(1)} km`
}

// Check if venue is within allowed distance
export function isVenueWithinRange(distanceKm: number): boolean {
  return distanceKm <= MAX_VENUE_DISTANCE_KM
}

// Get user's current position
export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation non supportata dal browser'))
      return
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // Cache position for 1 minute
    })
  })
}

// Get position error message in Italian
export function getPositionErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Permesso di geolocalizzazione negato'
    case error.POSITION_UNAVAILABLE:
      return 'Posizione non disponibile'
    case error.TIMEOUT:
      return 'Richiesta posizione scaduta'
    default:
      return 'Errore di geolocalizzazione'
  }
}

// Fetch nearby venues from API
export async function fetchNearbyVenues(
  latitude: number,
  longitude: number,
  radius: number = DEFAULT_SEARCH_RADIUS_KM
): Promise<{
  venues: Array<{
    id: string
    slug: string
    name: string
    city: string | null
    distance: number
  }>
  error?: string
}> {
  try {
    const response = await fetch(
      `/api/venues/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
    )

    if (!response.ok) {
      const data = await response.json()
      return { venues: [], error: data.error || 'Errore nel caricamento' }
    }

    const data = await response.json()
    return { venues: data.venues }
  } catch {
    return { venues: [], error: 'Errore di connessione' }
  }
}
