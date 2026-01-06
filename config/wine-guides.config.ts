import type { WineGuide } from '@/types'

export const WINE_GUIDES: WineGuide[] = [
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
]

export function getGuideById(id: string): WineGuide | undefined {
  return WINE_GUIDES.find(guide => guide.id === id)
}
