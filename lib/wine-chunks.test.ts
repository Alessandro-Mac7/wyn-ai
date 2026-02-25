/**
 * Unit tests for wine-chunks.ts
 * Tests chunking logic for semantic search embeddings
 */

import { describe, it, expect } from 'vitest'
import { wineToChunkText, wineToChunkTextWithKnowledge } from './wine-chunks'
import { WineWithRatings, WineRating, WineType, WineKnowledge, FoodPairingDetailed } from '@/types'

// ============================================
// TEST FIXTURES
// ============================================

/**
 * Creates a minimal Wine object with required fields
 */
function makeWine(overrides: Partial<WineWithRatings> = {}): WineWithRatings {
  return {
    id: 'wine-1',
    venue_id: 'venue-1',
    name: 'Barolo DOCG',
    wine_type: 'red' as WineType,
    price: 45,
    price_glass: null,
    producer: null,
    region: null,
    denomination: null,
    grape_varieties: null,
    year: null,
    description: null,
    available: true,
    recommended: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ratings: [],
    ...overrides,
  }
}

/**
 * Creates a WineRating object
 */
function makeRating(overrides: Partial<WineRating> = {}): WineRating {
  return {
    id: 'rating-1',
    wine_id: 'wine-1',
    guide_id: 'guide-1',
    guide_name: 'Gambero Rosso',
    score: '3 Bicchieri',
    confidence: 0.9,
    year: null,
    source_url: null,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

/**
 * Creates a WineKnowledge object with nullable fields
 */
function makeKnowledge(overrides: Partial<WineKnowledge> = {}): WineKnowledge {
  return {
    id: 'knowledge-1',
    wine_id: 'wine-1',
    producer_history: null,
    producer_philosophy: null,
    terroir_description: null,
    vineyard_details: null,
    soil_type: null,
    climate: null,
    vinification_process: null,
    aging_method: null,
    aging_duration: null,
    vintage_notes: null,
    vintage_quality: null,
    food_pairings: null,
    serving_temperature: null,
    decanting_time: null,
    glass_type: null,
    anecdotes: null,
    curiosities: null,
    knowledge_version: 1,
    reviewed_at: null,
    reviewed_by: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ============================================
// TESTS: wineToChunkText
// ============================================

describe('wineToChunkText', () => {
  it('should include all required fields (name, type, price)', () => {
    const wine = makeWine()
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Barolo DOCG')
    expect(chunk).toContain('Tipo: Rosso')
    expect(chunk).toContain('Prezzo: €45/bottiglia')
  })

  it('should format name with year when year is present', () => {
    const wine = makeWine({ year: 2019 })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Barolo DOCG (2019)')
  })

  it('should format price with glass price when available', () => {
    const wine = makeWine({ price_glass: 12 })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Prezzo: €45/bottiglia, €12/calice')
  })

  it('should include producer when present', () => {
    const wine = makeWine({ producer: 'Marchesi di Barolo' })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Produttore: Marchesi di Barolo')
  })

  it('should include region when present', () => {
    const wine = makeWine({ region: 'Piemonte' })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Regione: Piemonte')
  })

  it('should include denomination when present', () => {
    const wine = makeWine({ denomination: 'DOCG' })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Denominazione: DOCG')
  })

  it('should include grape varieties when present', () => {
    const wine = makeWine({ grape_varieties: ['Nebbiolo', 'Barbera'] })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Vitigni: Nebbiolo, Barbera')
  })

  it('should skip grape varieties when empty array', () => {
    const wine = makeWine({ grape_varieties: [] })
    const chunk = wineToChunkText(wine)

    expect(chunk).not.toContain('Vitigni:')
  })

  it('should include description when present', () => {
    const wine = makeWine({ description: 'Un vino robusto e complesso' })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Un vino robusto e complesso')
  })

  it('should only include ratings with confidence >= 0.7', () => {
    const wine = makeWine({
      ratings: [
        makeRating({ guide_name: 'Gambero Rosso', score: '3 Bicchieri', confidence: 0.9 }),
        makeRating({ guide_name: 'Veronelli', score: '95/100', confidence: 0.6 }),
        makeRating({ guide_name: 'Bibenda', score: '5 Grappoli', confidence: 0.75 }),
      ],
    })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Gambero Rosso: 3 Bicchieri')
    expect(chunk).not.toContain('Veronelli')
    expect(chunk).toContain('Bibenda: 5 Grappoli')
    expect(chunk).toContain('Valutazioni:')
  })

  it('should skip ratings section when no high-confidence ratings', () => {
    const wine = makeWine({
      ratings: [
        makeRating({ confidence: 0.5 }),
        makeRating({ confidence: 0.3 }),
      ],
    })
    const chunk = wineToChunkText(wine)

    expect(chunk).not.toContain('Valutazioni:')
  })

  it('should add recommended badge when recommended is true', () => {
    const wine = makeWine({ recommended: true })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Consigliato dal locale')
  })

  it('should not add recommended badge when recommended is false', () => {
    const wine = makeWine({ recommended: false })
    const chunk = wineToChunkText(wine)

    expect(chunk).not.toContain('Consigliato dal locale')
  })

  it('should map wine types to Italian labels', () => {
    const testCases: Array<{ type: WineType; expected: string }> = [
      { type: 'red', expected: 'Rosso' },
      { type: 'white', expected: 'Bianco' },
      { type: 'rose', expected: 'Rosé' },
      { type: 'sparkling', expected: 'Spumante' },
      { type: 'dessert', expected: 'Dessert' },
    ]

    testCases.forEach(({ type, expected }) => {
      const wine = makeWine({ wine_type: type })
      const chunk = wineToChunkText(wine)
      expect(chunk).toContain(`Tipo: ${expected}`)
    })
  })

  it('should join all parts with newlines', () => {
    const wine = makeWine({
      producer: 'Marchesi di Barolo',
      region: 'Piemonte',
      description: 'Vino eccellente',
    })
    const chunk = wineToChunkText(wine)

    const lines = chunk.split('\n')
    expect(lines.length).toBeGreaterThan(1)
    expect(lines).toContain('Barolo DOCG')
    expect(lines).toContain('Produttore: Marchesi di Barolo')
  })

  it('should handle complete wine with all fields', () => {
    const wine = makeWine({
      name: 'Barolo Cannubi',
      year: 2018,
      wine_type: 'red',
      price: 85,
      price_glass: 18,
      producer: 'Marchesi di Barolo',
      region: 'Piemonte',
      denomination: 'DOCG',
      grape_varieties: ['Nebbiolo'],
      description: 'Un grande Barolo dal Cru Cannubi',
      recommended: true,
      ratings: [
        makeRating({ guide_name: 'Gambero Rosso', score: '3 Bicchieri', confidence: 0.95 }),
        makeRating({ guide_name: 'Bibenda', score: '5 Grappoli', confidence: 0.85 }),
      ],
    })
    const chunk = wineToChunkText(wine)

    expect(chunk).toContain('Barolo Cannubi (2018)')
    expect(chunk).toContain('Tipo: Rosso')
    expect(chunk).toContain('Prezzo: €85/bottiglia, €18/calice')
    expect(chunk).toContain('Produttore: Marchesi di Barolo')
    expect(chunk).toContain('Regione: Piemonte')
    expect(chunk).toContain('Denominazione: DOCG')
    expect(chunk).toContain('Vitigni: Nebbiolo')
    expect(chunk).toContain('Un grande Barolo dal Cru Cannubi')
    expect(chunk).toContain('Valutazioni: Gambero Rosso: 3 Bicchieri, Bibenda: 5 Grappoli')
    expect(chunk).toContain('Consigliato dal locale')
  })
})

// ============================================
// TESTS: wineToChunkTextWithKnowledge
// ============================================

describe('wineToChunkTextWithKnowledge', () => {
  it('should return base text when knowledge is null', () => {
    const wine = makeWine()
    const chunkWithKnowledge = wineToChunkTextWithKnowledge(wine, null)
    const baseChunk = wineToChunkText(wine)

    expect(chunkWithKnowledge).toBe(baseChunk)
  })

  it('should return base text when knowledge is undefined', () => {
    const wine = makeWine()
    const chunkWithKnowledge = wineToChunkTextWithKnowledge(wine, undefined)
    const baseChunk = wineToChunkText(wine)

    expect(chunkWithKnowledge).toBe(baseChunk)
  })

  it('should append producer history when present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      producer_history: 'Fondata nel 1807, una delle cantine storiche del Piemonte.',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Storia del Produttore:')
    expect(chunk).toContain('Fondata nel 1807')
  })

  it('should append producer philosophy when present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      producer_philosophy: 'Rispetto della tradizione e innovazione sostenibile.',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Filosofia del Produttore:')
    expect(chunk).toContain('Rispetto della tradizione')
  })

  it('should append terroir description when present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      terroir_description: 'Vigneti esposti a sud su terreni calcarei.',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Terroir:')
    expect(chunk).toContain('Vigneti esposti a sud')
  })

  it('should append vineyard details when present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      vineyard_details: 'Vigneto Cannubi, 1.5 ettari a 300m slm.',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Vigneto:')
    expect(chunk).toContain('Vigneto Cannubi')
  })

  it('should combine soil type and climate on one line', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      soil_type: 'Argilloso-calcareo',
      climate: 'Continentale',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Terreno: Argilloso-calcareo, Clima: Continentale')
  })

  it('should append only soil type when climate is null', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      soil_type: 'Argilloso-calcareo',
      climate: null,
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Terreno: Argilloso-calcareo')
    expect(chunk).not.toContain('Clima:')
  })

  it('should append vinification process when present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      vinification_process: 'Fermentazione in acciaio a temperatura controllata.',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Vinificazione:')
    expect(chunk).toContain('Fermentazione in acciaio')
  })

  it('should append aging method with duration when both present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      aging_method: 'Botti di rovere francese',
      aging_duration: '24 mesi',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Affinamento:')
    expect(chunk).toContain('Botti di rovere francese (24 mesi)')
  })

  it('should append aging method without duration when duration is null', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      aging_method: 'Botti di rovere francese',
      aging_duration: null,
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Affinamento:')
    expect(chunk).toContain('Botti di rovere francese')
    expect(chunk).not.toMatch(/\(\d+ mesi\)/)
  })

  it('should append vintage notes with quality when both present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      vintage_notes: 'Annata calda e asciutta, vendemmia tardiva.',
      vintage_quality: 'eccellente',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Annata:')
    expect(chunk).toContain('Annata calda e asciutta, vendemmia tardiva. (Qualità: eccellente)')
  })

  it('should append vintage notes without quality when quality is null', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      vintage_notes: 'Annata equilibrata.',
      vintage_quality: null,
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Annata:')
    expect(chunk).toContain('Annata equilibrata.')
    expect(chunk).not.toContain('Qualità:')
  })

  it('should format food pairings with category, dishes, match, and notes', () => {
    const wine = makeWine()
    const pairings: FoodPairingDetailed[] = [
      {
        category: 'Carne',
        dishes: ['Brasato al Barolo', 'Costata alla griglia'],
        match: 'eccellente',
        notes: 'Perfetto con carni rosse',
      },
      {
        category: 'Formaggi',
        dishes: ['Castelmagno', 'Parmigiano Reggiano'],
        match: 'ottimo',
      },
    ]
    const knowledge = makeKnowledge({ food_pairings: pairings })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Abbinamenti:')
    expect(chunk).toContain('Carne: Brasato al Barolo, Costata alla griglia (eccellente) - Perfetto con carni rosse')
    expect(chunk).toContain('Formaggi: Castelmagno, Parmigiano Reggiano (ottimo)')
  })

  it('should append serving information when present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      serving_temperature: '18-20°C',
      decanting_time: '2 ore',
      glass_type: 'Ballon',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Servizio:')
    expect(chunk).toContain('Temperatura: 18-20°C')
    expect(chunk).toContain('Decantazione: 2 ore')
    expect(chunk).toContain('Bicchiere: Ballon')
  })

  it('should append only available serving fields', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      serving_temperature: '16-18°C',
      decanting_time: null,
      glass_type: null,
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Servizio:')
    expect(chunk).toContain('Temperatura: 16-18°C')
    expect(chunk).not.toContain('Decantazione:')
    expect(chunk).not.toContain('Bicchiere:')
  })

  it('should append anecdotes when present', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      anecdotes: 'Questo vino fu servito al matrimonio reale del 1898.',
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Aneddoti:')
    expect(chunk).toContain('matrimonio reale')
  })

  it('should format curiosities as bullet list', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge({
      curiosities: [
        'Primo Barolo certificato DOCG nel 1980',
        'Le vigne hanno più di 50 anni',
      ],
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Curiosità:')
    expect(chunk).toContain('• Primo Barolo certificato DOCG nel 1980')
    expect(chunk).toContain('• Le vigne hanno più di 50 anni')
  })

  it('should handle knowledge with all fields populated', () => {
    const wine = makeWine({ name: 'Barolo Riserva' })
    const pairings: FoodPairingDetailed[] = [
      { category: 'Carne', dishes: ['Brasato'], match: 'eccellente' },
    ]
    const knowledge = makeKnowledge({
      producer_history: 'Storica cantina',
      producer_philosophy: 'Tradizione',
      terroir_description: 'Terreno calcareo',
      vineyard_details: 'Vigneto Cannubi',
      soil_type: 'Argilloso',
      climate: 'Continentale',
      vinification_process: 'Fermentazione in acciaio',
      aging_method: 'Botti di rovere',
      aging_duration: '36 mesi',
      vintage_notes: 'Annata eccellente',
      vintage_quality: 'eccellente',
      food_pairings: pairings,
      serving_temperature: '18-20°C',
      decanting_time: '2 ore',
      glass_type: 'Ballon',
      anecdotes: 'Vino storico',
      curiosities: ['Prima DOCG', 'Vigne centenarie'],
    })
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)

    expect(chunk).toContain('Barolo Riserva')
    expect(chunk).toContain('Storia del Produttore:')
    expect(chunk).toContain('Filosofia del Produttore:')
    expect(chunk).toContain('Terroir:')
    expect(chunk).toContain('Vigneto:')
    expect(chunk).toContain('Terreno: Argilloso, Clima: Continentale')
    expect(chunk).toContain('Vinificazione:')
    expect(chunk).toContain('Affinamento:')
    expect(chunk).toContain('Botti di rovere (36 mesi)')
    expect(chunk).toContain('Annata:')
    expect(chunk).toContain('eccellente')
    expect(chunk).toContain('Abbinamenti:')
    expect(chunk).toContain('Servizio:')
    expect(chunk).toContain('Aneddoti:')
    expect(chunk).toContain('Curiosità:')
  })

  it('should return base text when knowledge has all null fields', () => {
    const wine = makeWine()
    const knowledge = makeKnowledge() // All fields null by default
    const chunk = wineToChunkTextWithKnowledge(wine, knowledge)
    const baseChunk = wineToChunkText(wine)

    expect(chunk).toBe(baseChunk)
  })
})
