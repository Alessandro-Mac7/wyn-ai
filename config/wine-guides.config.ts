import type { WineGuide } from '@/types'

export const WINE_GUIDES: WineGuide[] = [
  // === GUIDE ITALIANE ===
  {
    id: 'gambero-rosso',
    name: 'Gambero Rosso',
    ratingSystem: 'Tre Bicchieri (1-3 glasses)',
    philosophy: 'Focus on Italian wines, tradition, and terroir expression',
  },
  {
    id: 'veronelli',
    name: 'Veronelli',
    ratingSystem: 'Stars (1-3) + Soli (1-3 suns)',
    philosophy: 'Emphasis on elegance, balance, and winemaking excellence',
  },
  {
    id: 'bibenda',
    name: 'Bibenda',
    ratingSystem: 'Grappoli (1-5 bunches)',
    philosophy: 'Technical precision and consistent quality assessment',
  },
  {
    id: 'doctorwine',
    name: 'DoctorWine (Cernilli)',
    ratingSystem: '50-100 points',
    philosophy: 'Italian wine expertise with focus on authenticity and value',
  },
  // === GUIDE INTERNAZIONALI ===
  {
    id: 'wine-spectator',
    name: 'Wine Spectator',
    ratingSystem: '50-100 points',
    philosophy: 'International perspective, value for quality',
  },
  {
    id: 'robert-parker',
    name: 'Robert Parker Wine Advocate',
    ratingSystem: '50-100 points',
    philosophy: 'Power, concentration, and intensity focused',
  },
  {
    id: 'james-suckling',
    name: 'James Suckling',
    ratingSystem: '50-100 points',
    philosophy: 'Fresh, vibrant wines with elegance and finesse',
  },
  {
    id: 'jancis-robinson',
    name: 'Jancis Robinson',
    ratingSystem: '0-20 points',
    philosophy: 'Academic approach, terroir-driven, balanced assessment',
  },
  {
    id: 'decanter',
    name: 'Decanter',
    ratingSystem: '50-100 points',
    philosophy: 'British perspective, classic style appreciation',
  },
  {
    id: 'vinous',
    name: 'Vinous (Antonio Galloni)',
    ratingSystem: '50-100 points',
    philosophy: 'Detail-oriented, emphasis on site expression and aging potential',
  },
  {
    id: 'wine-enthusiast',
    name: 'Wine Enthusiast',
    ratingSystem: '50-100 points',
    philosophy: 'Consumer-friendly ratings, value-conscious approach',
  },
]

export function getGuideById(id: string): WineGuide | undefined {
  return WINE_GUIDES.find(guide => guide.id === id)
}
