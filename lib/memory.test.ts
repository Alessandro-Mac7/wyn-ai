/**
 * Unit tests for memory.ts - formatMemoriesForPrompt function
 */

import { describe, it, expect, vi } from 'vitest'
import type { MemoryFragment, MemoryFragmentType } from '@/types/user'

// Mock external dependencies to avoid side effects
vi.mock('./llm', () => ({ chat: vi.fn() }))
vi.mock('./embeddings', () => ({ embedText: vi.fn(), isEmbeddingAvailable: vi.fn() }))
vi.mock('./supabase-auth-server', () => ({ supabaseAdmin: { from: vi.fn(), rpc: vi.fn() } }))

import { formatMemoriesForPrompt } from './memory'

// ============================================
// TEST HELPERS
// ============================================

function makeMemory(
  fragment_type: MemoryFragmentType,
  content: string,
  metadata: Record<string, unknown> = {}
): MemoryFragment {
  return {
    id: `test-${Math.random().toString(36).substring(7)}`,
    user_id: 'test-user-id',
    fragment_type,
    content,
    metadata,
    weight: 1.0,
    last_relevant_at: new Date().toISOString(),
    source_session_id: null,
    source_venue_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ============================================
// TESTS
// ============================================

describe('formatMemoriesForPrompt', () => {
  it('should return empty string for empty array', () => {
    const result = formatMemoriesForPrompt([])
    expect(result).toBe('')
  })

  it('should return empty string for null input', () => {
    // @ts-expect-error Testing null input
    const result = formatMemoriesForPrompt(null)
    expect(result).toBe('')
  })

  it('should return empty string for undefined input', () => {
    // @ts-expect-error Testing undefined input
    const result = formatMemoriesForPrompt(undefined)
    expect(result).toBe('')
  })

  it('should format a single memory correctly', () => {
    const memories = [makeMemory('preference', 'Mi piacciono i vini rossi corposi')]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('## Ricordi dell\'utente')
    expect(result).toContain('**Preferenze:**')
    expect(result).toContain('- Mi piacciono i vini rossi corposi')
  })

  it('should group multiple memories of the same type', () => {
    const memories = [
      makeMemory('preference', 'Mi piacciono i vini rossi'),
      makeMemory('preference', 'Preferisco il Barolo'),
    ]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('**Preferenze:**')
    expect(result).toContain('- Mi piacciono i vini rossi')
    expect(result).toContain('- Preferisco il Barolo')
  })

  it('should create separate sections for different types', () => {
    const memories = [
      makeMemory('preference', 'Mi piacciono i vini rossi'),
      makeMemory('dislike', 'Non mi piacciono i vini dolci'),
      makeMemory('purchase', 'Voglio comprare un Brunello'),
    ]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('**Preferenze:**')
    expect(result).toContain('**Non gradisce:**')
    expect(result).toContain('**Intenzioni di acquisto:**')
  })

  it('should use correct Italian labels for all memory types', () => {
    const memories = [
      makeMemory('preference', 'Test preference'),
      makeMemory('dislike', 'Test dislike'),
      makeMemory('purchase', 'Test purchase'),
      makeMemory('feedback', 'Test feedback'),
      makeMemory('context', 'Test context'),
      makeMemory('occasion', 'Test occasion'),
    ]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('**Preferenze:**')
    expect(result).toContain('**Non gradisce:**')
    expect(result).toContain('**Intenzioni di acquisto:**')
    expect(result).toContain('**Feedback su vini:**')
    expect(result).toContain('**Contesto:**')
    expect(result).toContain('**Occasioni:**')
  })

  it('should append wine_name from metadata', () => {
    const memories = [
      makeMemory('feedback', 'Ottimo vino', { wine_name: 'Barolo DOCG' }),
    ]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('- Ottimo vino (Barolo DOCG)')
  })

  it('should append venue_name from metadata', () => {
    const memories = [
      makeMemory('context', 'Cena romantica', { venue_name: 'Ristorante La Pergola' }),
    ]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('- Cena romantica @ Ristorante La Pergola')
  })

  it('should append both wine_name and venue_name from metadata', () => {
    const memories = [
      makeMemory('purchase', 'Comprato per occasione speciale', {
        wine_name: 'Barolo DOCG',
        venue_name: 'Enoteca Il Vino',
      }),
    ]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('- Comprato per occasione speciale (Barolo DOCG) @ Enoteca Il Vino')
  })

  it('should handle memory with no metadata fields', () => {
    const memories = [makeMemory('preference', 'Preferisco vini secchi', {})]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('- Preferisco vini secchi')
    expect(result).not.toContain('(')
    expect(result).not.toContain('@')
  })

  it('should handle memory with other metadata fields (not wine_name or venue_name)', () => {
    const memories = [
      makeMemory('preference', 'Mi piace il Nebbiolo', {
        wine_type: 'red',
        region: 'Piemonte',
        grape: 'Nebbiolo',
      }),
    ]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toContain('- Mi piace il Nebbiolo')
    // Should not append non-wine_name/venue_name fields
    expect(result).not.toContain('red')
    expect(result).not.toContain('Piemonte')
  })

  it('should include header "## Ricordi dell\'utente"', () => {
    const memories = [makeMemory('preference', 'Test memory')]

    const result = formatMemoriesForPrompt(memories)

    expect(result).toMatch(/^## Ricordi dell'utente\n\n/)
  })

  it('should handle mixed types with different metadata combinations', () => {
    const memories = [
      makeMemory('preference', 'Amo i Barolo', { wine_name: 'Barolo DOCG' }),
      makeMemory('dislike', 'Troppo dolce', { wine_name: 'Moscato d\'Asti' }),
      makeMemory('purchase', 'Comprato per regalo', { venue_name: 'Enoteca' }),
      makeMemory('feedback', 'Eccellente', {
        wine_name: 'Brunello',
        venue_name: 'Ristorante',
      }),
      makeMemory('context', 'Per cena di famiglia'),
      makeMemory('occasion', 'Anniversario', { venue_name: 'Trattoria' }),
    ]

    const result = formatMemoriesForPrompt(memories)

    // Check all sections present
    expect(result).toContain('**Preferenze:**')
    expect(result).toContain('**Non gradisce:**')
    expect(result).toContain('**Intenzioni di acquisto:**')
    expect(result).toContain('**Feedback su vini:**')
    expect(result).toContain('**Contesto:**')
    expect(result).toContain('**Occasioni:**')

    // Check metadata formatting
    expect(result).toContain('- Amo i Barolo (Barolo DOCG)')
    expect(result).toContain('- Troppo dolce (Moscato d\'Asti)')
    expect(result).toContain('- Comprato per regalo @ Enoteca')
    expect(result).toContain('- Eccellente (Brunello) @ Ristorante')
    expect(result).toContain('- Per cena di famiglia')
    expect(result).toContain('- Anniversario @ Trattoria')
  })

  it('should separate sections with double newlines', () => {
    const memories = [
      makeMemory('preference', 'Test 1'),
      makeMemory('dislike', 'Test 2'),
    ]

    const result = formatMemoriesForPrompt(memories)

    // Sections should be separated by \n\n
    expect(result).toMatch(/\*\*.*:\*\*\n.*\n\n\*\*.*:\*\*/)
  })
})
