// ============================================
// WYN - Unit Tests for lib/prompts.ts
// ============================================

import { describe, it, expect } from 'vitest'
import type { Wine, WineWithRatings, WineRating, ChatMessage } from '@/types'
import {
  SYSTEM_PROMPT_GENERAL,
  getVenueSystemPrompt,
  getVenueSystemPromptRAG,
  formatWineListForPrompt,
  formatWineListWithRatings,
  buildChatMessages,
  GENERAL_SUGGESTIONS,
  VENUE_SUGGESTIONS,
} from './prompts'

// ============================================
// TEST DATA FACTORIES
// ============================================

function makeWine(overrides: Partial<Wine> = {}): Wine {
  return {
    id: 'wine-1',
    venue_id: 'venue-1',
    name: 'Chianti Classico',
    wine_type: 'red',
    price: 35,
    price_glass: null,
    producer: 'Antinori',
    region: 'Toscana',
    denomination: 'DOCG',
    grape_varieties: ['Sangiovese'],
    year: 2020,
    description: 'Elegante e strutturato',
    available: true,
    recommended: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeRating(overrides: Partial<WineRating> = {}): WineRating {
  return {
    id: 'rating-1',
    wine_id: 'wine-1',
    guide_id: 'guide-1',
    guide_name: 'Wine Spectator',
    score: '92',
    confidence: 0.9,
    year: 2020,
    source_url: 'https://example.com',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeWineWithRatings(
  wineOverrides: Partial<Wine> = {},
  ratings: WineRating[] = []
): WineWithRatings {
  return {
    ...makeWine(wineOverrides),
    ratings,
  }
}

// ============================================
// SYSTEM_PROMPT_GENERAL
// ============================================

describe('SYSTEM_PROMPT_GENERAL', () => {
  it('should contain NO PRICE rule (RULE-004)', () => {
    expect(SYSTEM_PROMPT_GENERAL).toContain('NIENTE PREZZI O VINI SPECIFICI')
    expect(SYSTEM_PROMPT_GENERAL.toLowerCase()).toContain('mai inventare')
  })

  it('should mention general mode behavior', () => {
    expect(SYSTEM_PROMPT_GENERAL).toContain('Non sei in un locale')
    expect(SYSTEM_PROMPT_GENERAL.toLowerCase()).toContain('tipologie')
    expect(SYSTEM_PROMPT_GENERAL.toLowerCase()).toContain('regioni')
  })

  it('should enforce ONE recommendation rule', () => {
    expect(SYSTEM_PROMPT_GENERAL).toContain('UN SOLO CONSIGLIO')
    expect(SYSTEM_PROMPT_GENERAL).toContain('ESATTAMENTE UNA raccomandazione')
  })

  it('should include food pairing logic', () => {
    expect(SYSTEM_PROMPT_GENERAL.toLowerCase()).toContain('pesce')
    expect(SYSTEM_PROMPT_GENERAL.toLowerCase()).toContain('carne rossa')
    expect(SYSTEM_PROMPT_GENERAL.toLowerCase()).toContain('abbinamento')
  })

  it('should be in Italian', () => {
    expect(SYSTEM_PROMPT_GENERAL).toContain('Sei WYN')
    expect(SYSTEM_PROMPT_GENERAL).toContain('Rispondi in italiano')
  })
})

// ============================================
// getVenueSystemPrompt
// ============================================

describe('getVenueSystemPrompt', () => {
  it('should include venue name (RULE-002)', () => {
    const wines = [makeWineWithRatings()]
    const prompt = getVenueSystemPrompt('Osteria del Vino', wines)

    expect(prompt).toContain('Osteria del Vino')
    expect(prompt).toContain('sommelier di Osteria del Vino')
  })

  it('should include wine names (RULE-002: only venue wines)', () => {
    const wines = [
      makeWineWithRatings({ name: 'Chianti Classico' }),
      makeWineWithRatings({ name: 'Brunello di Montalcino', id: 'wine-2' }),
    ]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('Chianti Classico')
    expect(prompt).toContain('Brunello di Montalcino')
  })

  it('should include prices in €XX format (RULE-003)', () => {
    const wines = [makeWineWithRatings({ price: 45, price_glass: 12 })]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('€45')
    expect(prompt).toContain('€12')
    expect(prompt).toContain('bottiglia')
    expect(prompt).toContain('calice')
  })

  it('should enforce ALWAYS mention price rule (RULE-003)', () => {
    const wines = [makeWineWithRatings()]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('PREZZO SEMPRE')
    expect(prompt).toContain('Menziona SEMPRE il prezzo')
  })

  it('should group wines by type', () => {
    const wines = [
      makeWineWithRatings({ name: 'Barolo', wine_type: 'red' }),
      makeWineWithRatings({ name: 'Vermentino', wine_type: 'white', id: 'wine-2' }),
      makeWineWithRatings({ name: 'Franciacorta', wine_type: 'sparkling', id: 'wine-3' }),
    ]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('Vini Rossi')
    expect(prompt).toContain('Vini Bianchi')
    expect(prompt).toContain('Spumanti')
  })

  it('should handle empty wine list', () => {
    const prompt = getVenueSystemPrompt('Osteria', [])

    expect(prompt).toContain('Nessun vino disponibile al momento')
  })

  it('should show high-confidence ratings (>=0.7)', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Barolo' },
        [makeRating({ guide_name: 'Wine Spectator', score: '95', confidence: 0.9 })]
      ),
    ]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('⭐')
    expect(prompt).toContain('Wine Spectator')
    expect(prompt).toContain('95')
  })

  it('should filter out low-confidence ratings (<0.7)', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Barolo' },
        [
          makeRating({ guide_name: 'Wine Spectator', score: '95', confidence: 0.9 }),
          makeRating({ guide_name: 'Low Guide', score: '80', confidence: 0.5, id: 'rating-2' }),
        ]
      ),
    ]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('Wine Spectator')
    expect(prompt).not.toContain('Low Guide')
  })

  it('should include premium wines section when ratings exist', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Barolo' },
        [makeRating({ guide_name: 'Gambero Rosso', score: '3', confidence: 0.95 })]
      ),
    ]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('VINI PREMIATI')
    expect(prompt).toContain('Tre Bicchieri')
    expect(prompt).toContain('SOMMELIER REALI')
  })

  it('should include recommended wines section when present', () => {
    const wines = [makeWineWithRatings({ recommended: true })]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('CONSIGLIATI DAL LOCALE')
  })

  it('should NOT include recommended section when no recommended wines', () => {
    const wines = [makeWineWithRatings({ recommended: false })]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).not.toContain('CONSIGLIATI DAL LOCALE')
  })

  it('should include budget filtering rules', () => {
    const wines = [makeWineWithRatings()]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('BUDGET = FILTRO RIGIDO')
    expect(prompt).toContain('ELIMINA dalla considerazione TUTTI i vini che superano quel prezzo')
  })

  it('should include ONE WINE rule (RULE-002)', () => {
    const wines = [makeWineWithRatings()]
    const prompt = getVenueSystemPrompt('Osteria', wines)

    expect(prompt).toContain('UN SOLO VINO')
    expect(prompt).toContain('ESATTAMENTE UN vino per richiesta')
  })
})

// ============================================
// getVenueSystemPromptRAG
// ============================================

describe('getVenueSystemPromptRAG', () => {
  it('should include venue name', () => {
    const prompt = getVenueSystemPromptRAG('Enoteca Pinchiorri', 'RAG_CONTEXT', 150)

    expect(prompt).toContain('Enoteca Pinchiorri')
    expect(prompt).toContain('sommelier di Enoteca Pinchiorri')
  })

  it('should include RAG context exactly', () => {
    const ragContext = '### Vini Rossi\n- **Barolo** - €120/bottiglia'
    const prompt = getVenueSystemPromptRAG('Osteria', ragContext, 100)

    expect(prompt).toContain(ragContext)
  })

  it('should include total wine count', () => {
    const prompt = getVenueSystemPromptRAG('Osteria', 'RAG_CONTEXT', 250)

    expect(prompt).toContain('250')
    expect(prompt).toContain('catalogo completo di 250 etichette')
  })

  it('should mention wines were selected from catalog', () => {
    const prompt = getVenueSystemPromptRAG('Osteria', 'RAG_CONTEXT', 100)

    expect(prompt).toContain('selezionati dal catalogo')
    expect(prompt).toContain('più rilevanti')
  })

  it('should include core rules (budget, price, one wine)', () => {
    const prompt = getVenueSystemPromptRAG('Osteria', 'RAG_CONTEXT', 100)

    expect(prompt).toContain('UN SOLO VINO')
    expect(prompt).toContain('BUDGET = FILTRO RIGIDO')
    expect(prompt).toContain('PREZZO SEMPRE')
  })
})

// ============================================
// formatWineListForPrompt
// ============================================

describe('formatWineListForPrompt', () => {
  it('should return empty message for empty list', () => {
    const result = formatWineListForPrompt([])
    expect(result).toBe('Nessun vino disponibile al momento.')
  })

  it('should group wines by type', () => {
    const wines = [
      makeWine({ name: 'Barolo', wine_type: 'red' }),
      makeWine({ name: 'Soave', wine_type: 'white', id: 'wine-2' }),
    ]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('### Vini Rossi')
    expect(result).toContain('### Vini Bianchi')
  })

  it('should format wine with price (RULE-003)', () => {
    const wines = [makeWine({ name: 'Chianti', price: 30, price_glass: 8 })]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('**Chianti**')
    expect(result).toContain('€30/bottiglia')
    expect(result).toContain('€8/calice')
  })

  it('should include year if present', () => {
    const wines = [makeWine({ name: 'Barolo', year: 2018 })]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('**Barolo** (2018)')
  })

  it('should include producer, region, grapes', () => {
    const wines = [
      makeWine({
        name: 'Barolo',
        producer: 'Ceretto',
        region: 'Piemonte',
        grape_varieties: ['Nebbiolo'],
      }),
    ]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('Ceretto')
    expect(result).toContain('Piemonte')
    expect(result).toContain('Nebbiolo')
  })

  it('should include description if present', () => {
    const wines = [makeWine({ description: 'Elegante e potente' })]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('Elegante e potente')
  })

  it('should handle wine with only bottle price (no glass)', () => {
    const wines = [makeWine({ price: 50, price_glass: null })]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('€50/bottiglia')
    expect(result).not.toContain('calice')
  })
})

// ============================================
// formatWineListWithRatings
// ============================================

describe('formatWineListWithRatings', () => {
  it('should return empty message for empty list', () => {
    const result = formatWineListWithRatings([])
    expect(result).toBe('Nessun vino disponibile al momento.')
  })

  it('should group wines by type', () => {
    const wines = [
      makeWineWithRatings({ name: 'Barolo', wine_type: 'red' }),
      makeWineWithRatings({ name: 'Prosecco', wine_type: 'sparkling', id: 'wine-2' }),
      makeWineWithRatings({ name: 'Moscato', wine_type: 'dessert', id: 'wine-3' }),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).toContain('### Vini Rossi')
    expect(result).toContain('### Spumanti')
    expect(result).toContain('### Vini da Dessert')
  })

  it('should include ratings with star emoji', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Barolo' },
        [makeRating({ guide_name: 'Wine Spectator', score: '94', confidence: 0.9 })]
      ),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).toContain('⭐')
    expect(result).toContain('Wine Spectator: 94')
  })

  it('should filter out low-confidence ratings (<0.7)', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Barolo' },
        [
          makeRating({ guide_name: 'Good Guide', score: '95', confidence: 0.9 }),
          makeRating({ guide_name: 'Bad Guide', score: '70', confidence: 0.6, id: 'rating-2' }),
        ]
      ),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).toContain('Good Guide')
    expect(result).not.toContain('Bad Guide')
  })

  it('should show multiple high-confidence ratings', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Barolo' },
        [
          makeRating({ guide_name: 'Wine Spectator', score: '95', confidence: 0.95 }),
          makeRating({
            guide_name: 'Gambero Rosso',
            score: '3',
            confidence: 0.9,
            id: 'rating-2',
          }),
        ]
      ),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).toContain('Wine Spectator: 95')
    expect(result).toContain('Gambero Rosso: 3')
  })

  it('should not show rating section if no high-confidence ratings', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Barolo' },
        [makeRating({ guide_name: 'Low Guide', score: '80', confidence: 0.5 })]
      ),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).not.toContain('⭐')
    expect(result).not.toContain('Low Guide')
  })

  it('should format all wine details correctly', () => {
    const wines = [
      makeWineWithRatings(
        {
          name: 'Brunello di Montalcino',
          year: 2016,
          price: 80,
          price_glass: 18,
          producer: 'Biondi Santi',
          region: 'Toscana',
          grape_varieties: ['Sangiovese Grosso'],
          description: 'Potente e longevo',
        },
        [makeRating({ guide_name: 'Wine Spectator', score: '96', confidence: 0.95 })]
      ),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).toContain('**Brunello di Montalcino** (2016)')
    expect(result).toContain('€80/bottiglia, €18/calice')
    expect(result).toContain('Biondi Santi')
    expect(result).toContain('Toscana')
    expect(result).toContain('Sangiovese Grosso')
    expect(result).toContain('⭐ Wine Spectator: 96')
    expect(result).toContain('Potente e longevo')
  })
})

// ============================================
// buildChatMessages
// ============================================

describe('buildChatMessages', () => {
  it('should build messages with system first', () => {
    const messages = buildChatMessages('Ciao', 'SYSTEM_PROMPT')

    expect(messages[0].role).toBe('system')
    expect(messages[0].content).toBe('SYSTEM_PROMPT')
  })

  it('should place user message last', () => {
    const messages = buildChatMessages('Consigliami un vino', 'SYSTEM_PROMPT')

    expect(messages[messages.length - 1].role).toBe('user')
    expect(messages[messages.length - 1].content).toBe('Consigliami un vino')
  })

  it('should work with empty history', () => {
    const messages = buildChatMessages('Test', 'SYSTEM_PROMPT', [])

    expect(messages).toHaveLength(2)
    expect(messages[0].role).toBe('system')
    expect(messages[1].role).toBe('user')
  })

  it('should insert history between system and user message', () => {
    const history: ChatMessage[] = [
      { role: 'user', content: 'Prima domanda' },
      { role: 'assistant', content: 'Prima risposta' },
    ]
    const messages = buildChatMessages('Seconda domanda', 'SYSTEM_PROMPT', history)

    expect(messages).toHaveLength(4)
    expect(messages[0].role).toBe('system')
    expect(messages[1].content).toBe('Prima domanda')
    expect(messages[2].content).toBe('Prima risposta')
    expect(messages[3].content).toBe('Seconda domanda')
  })

  it('should preserve history order', () => {
    const history: ChatMessage[] = [
      { role: 'user', content: 'Msg 1' },
      { role: 'assistant', content: 'Msg 2' },
      { role: 'user', content: 'Msg 3' },
      { role: 'assistant', content: 'Msg 4' },
    ]
    const messages = buildChatMessages('Msg 5', 'SYSTEM_PROMPT', history)

    expect(messages[1].content).toBe('Msg 1')
    expect(messages[2].content).toBe('Msg 2')
    expect(messages[3].content).toBe('Msg 3')
    expect(messages[4].content).toBe('Msg 4')
    expect(messages[5].content).toBe('Msg 5')
  })
})

// ============================================
// SUGGESTIONS CONSTANTS
// ============================================

describe('GENERAL_SUGGESTIONS', () => {
  it('should have 3 suggestions', () => {
    expect(GENERAL_SUGGESTIONS).toHaveLength(3)
  })

  it('should be in Italian', () => {
    expect(GENERAL_SUGGESTIONS.join(' ').toLowerCase()).toContain('rosso')
    expect(GENERAL_SUGGESTIONS.join(' ').toLowerCase()).toMatch(/vini|bollicine/)
  })

  it('should be helpful suggestions for general mode', () => {
    const combined = GENERAL_SUGGESTIONS.join(' ')
    // General mode can mention price ranges (like "sotto 30€") but not specific wine prices
    expect(combined.toLowerCase()).toMatch(/vini|rosso|bollicine/)
  })
})

describe('VENUE_SUGGESTIONS', () => {
  it('should have 3 suggestions', () => {
    expect(VENUE_SUGGESTIONS).toHaveLength(3)
  })

  it('should be in Italian', () => {
    expect(VENUE_SUGGESTIONS.join(' ').toLowerCase()).toContain('consigli')
  })

  it('should mention food pairing or wine characteristics', () => {
    const combined = VENUE_SUGGESTIONS.join(' ').toLowerCase()
    expect(combined).toMatch(/pesce|rosso|bollicine|corposo|festeggiare/)
  })
})

// ============================================
// EDGE CASES & INTEGRATION
// ============================================

describe('Edge Cases', () => {
  it('should handle wine with no producer, region, or grapes', () => {
    const wines = [
      makeWine({
        producer: null,
        region: null,
        grape_varieties: null,
      }),
    ]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('**Chianti Classico**')
    expect(result).toContain('€35')
  })

  it('should handle wine with empty grape varieties array', () => {
    const wines = [makeWine({ grape_varieties: [] })]
    const result = formatWineListForPrompt(wines)

    expect(result).not.toContain('undefined')
  })

  it('should handle ratings with confidence exactly 0.7', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Test Wine' },
        [makeRating({ guide_name: 'Edge Guide', score: '90', confidence: 0.7 })]
      ),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).toContain('Edge Guide') // Should be included (>= 0.7)
  })

  it('should handle ratings with confidence 0.69', () => {
    const wines = [
      makeWineWithRatings(
        { name: 'Test Wine' },
        [makeRating({ guide_name: 'Low Guide', score: '90', confidence: 0.69 })]
      ),
    ]
    const result = formatWineListWithRatings(wines)

    expect(result).not.toContain('Low Guide') // Should be filtered out (< 0.7)
  })

  it('should handle multiple wines of same type', () => {
    const wines = [
      makeWine({ name: 'Barolo', wine_type: 'red' }),
      makeWine({ name: 'Brunello', wine_type: 'red', id: 'wine-2' }),
      makeWine({ name: 'Chianti', wine_type: 'red', id: 'wine-3' }),
    ]
    const result = formatWineListForPrompt(wines)

    expect(result).toContain('### Vini Rossi')
    expect(result).toContain('Barolo')
    expect(result).toContain('Brunello')
    expect(result).toContain('Chianti')
  })
})
