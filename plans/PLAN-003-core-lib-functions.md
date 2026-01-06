# PLAN-003: Core Types & Library Functions

## Status
- [x] Draft
- [ ] Under Review
- [ ] Approved
- [ ] In Progress
- [ ] Completed

## Metadata
| Field | Value |
|-------|-------|
| Author | AGENT_ARCHITECT |
| Created | 2025-01-02 |
| Type | feature |
| Priority | P0 |
| Dependencies | PLAN-002 (database) |

---

## 1. Summary

Implement core library functions: typed Supabase client, LLM client (Groq/Anthropic), AI prompts, and utility functions. These form the service layer used by all features.

---

## 2. Goals

- Create typed Supabase client with helper functions
- Implement LLM client supporting Groq (dev) and Anthropic (prod)
- Define AI system prompts for sommelier behavior
- Create utility functions for common operations
- Ensure all functions have proper error handling

---

## 3. Non-Goals

- UI components (PLAN-007)
- API routes (PLAN-004, PLAN-005)
- Enrichment logic (PLAN-006)

---

## 4. Affected Areas

| Area | Impact |
|------|--------|
| `lib/supabase.ts` | Typed client + CRUD helpers |
| `lib/llm.ts` | LLM client with provider switching |
| `lib/prompts.ts` | System prompts for AI |
| `lib/utils.ts` | Utility functions |
| `types/index.ts` | Complete type definitions |

---

## 5. Technical Design

### 5.1 Types (`types/index.ts`)

```typescript
// ============================================
// CORE TYPES
// ============================================

export type WineType = 'red' | 'white' | 'rose' | 'sparkling' | 'dessert'

// ============================================
// DATABASE ENTITIES
// ============================================

export interface Venue {
  id: string
  slug: string
  name: string
  description: string | null
  email: string | null
  created_at: string
  updated_at: string
}

export interface Wine {
  id: string
  venue_id: string
  name: string
  wine_type: WineType
  price: number
  price_glass: number | null
  producer: string | null
  region: string | null
  denomination: string | null
  grape_varieties: string[] | null
  year: number | null
  description: string | null
  available: boolean
  created_at: string
  updated_at: string
}

export interface WineRating {
  id: string
  wine_id: string
  guide_id: string
  guide_name: string
  score: string
  confidence: number
  year: number | null
  source_url: string | null
  created_at: string
}

export interface WineWithRatings extends Wine {
  ratings: WineRating[]
}

// ============================================
// API TYPES
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  message: string
  venue_slug?: string // If provided, venue mode
  history?: ChatMessage[]
}

export interface ChatResponse {
  message: string
  wines_mentioned?: string[] // Wine IDs referenced
}

export interface AdminLoginRequest {
  email: string
  password: string
}

export interface AdminLoginResponse {
  success: boolean
  token?: string
  venue?: Venue
  error?: string
}

// ============================================
// WINE INPUT TYPES
// ============================================

export interface WineCreateInput {
  name: string
  wine_type: WineType
  price: number
  price_glass?: number
  producer?: string
  region?: string
  denomination?: string
  grape_varieties?: string[]
  year?: number
  description?: string
}

export interface WineUpdateInput extends Partial<WineCreateInput> {
  available?: boolean
}

// ============================================
// LLM TYPES
// ============================================

export interface LLMConfig {
  provider: 'groq' | 'anthropic'
  model: string
  maxTokens: number
  temperature: number
}

export interface LLMResponse {
  content: string
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}
```

### 5.2 Supabase Client (`lib/supabase.ts`)

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Venue, Wine, WineWithRatings, WineCreateInput, WineUpdateInput } from '@/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ============================================
// VENUE FUNCTIONS
// ============================================

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching venue:', error)
    return null
  }
  return data
}

export async function verifyVenueCredentials(
  email: string,
  password: string
): Promise<Venue | null> {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('email', email)
    .eq('password_hash', password) // MVP: plain text comparison
    .single()

  if (error) return null
  return data
}

// ============================================
// WINE FUNCTIONS
// ============================================

export async function getWinesByVenue(
  venueId: string,
  onlyAvailable = true
): Promise<Wine[]> {
  let query = supabase
    .from('wines')
    .select('*')
    .eq('venue_id', venueId)
    .order('wine_type')
    .order('name')

  if (onlyAvailable) {
    query = query.eq('available', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching wines:', error)
    return []
  }
  return data || []
}

export async function getWinesWithRatings(
  venueId: string,
  onlyAvailable = false
): Promise<WineWithRatings[]> {
  const { data, error } = await supabase
    .from('wines')
    .select(`
      *,
      ratings:wine_ratings(*)
    `)
    .eq('venue_id', venueId)
    .order('wine_type')
    .order('name')

  if (error) {
    console.error('Error fetching wines with ratings:', error)
    return []
  }

  let wines = data || []
  if (onlyAvailable) {
    wines = wines.filter(w => w.available)
  }
  return wines as WineWithRatings[]
}

export async function createWine(
  venueId: string,
  input: WineCreateInput
): Promise<Wine | null> {
  const { data, error } = await supabase
    .from('wines')
    .insert({
      venue_id: venueId,
      ...input,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating wine:', error)
    return null
  }
  return data
}

export async function updateWine(
  wineId: string,
  input: WineUpdateInput
): Promise<Wine | null> {
  const { data, error } = await supabase
    .from('wines')
    .update(input)
    .eq('id', wineId)
    .select()
    .single()

  if (error) {
    console.error('Error updating wine:', error)
    return null
  }
  return data
}

export async function deleteWine(wineId: string): Promise<boolean> {
  const { error } = await supabase
    .from('wines')
    .delete()
    .eq('id', wineId)

  if (error) {
    console.error('Error deleting wine:', error)
    return false
  }
  return true
}

export async function toggleWineAvailability(
  wineId: string,
  available: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('wines')
    .update({ available })
    .eq('id', wineId)

  if (error) {
    console.error('Error toggling wine:', error)
    return false
  }
  return true
}
```

### 5.3 LLM Client (`lib/llm.ts`)

```typescript
import type { ChatMessage, LLMConfig, LLMResponse } from '@/types'

// ============================================
// CONFIGURATION
// ============================================

const GROQ_CONFIG: LLMConfig = {
  provider: 'groq',
  model: 'llama-3.1-70b-versatile',
  maxTokens: 1024,
  temperature: 0.7,
}

const ANTHROPIC_CONFIG: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-3-haiku-20240307',
  maxTokens: 1024,
  temperature: 0.7,
}

// Use Groq in dev, Anthropic in prod (or when GROQ fails)
function getConfig(): LLMConfig {
  if (process.env.NODE_ENV === 'production' && process.env.ANTHROPIC_API_KEY) {
    return ANTHROPIC_CONFIG
  }
  return GROQ_CONFIG
}

// ============================================
// GROQ CLIENT
// ============================================

async function callGroq(
  messages: ChatMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${error}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0].message.content,
    model: data.model,
    usage: {
      input_tokens: data.usage?.prompt_tokens || 0,
      output_tokens: data.usage?.completion_tokens || 0,
    },
  }
}

// ============================================
// ANTHROPIC CLIENT
// ============================================

async function callAnthropic(
  messages: ChatMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  // Extract system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemMessage,
      messages: userMessages.map(m => ({ role: m.role, content: m.content })),
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Anthropic API error: ${error}`)
  }

  const data = await response.json()
  return {
    content: data.content[0].text,
    model: data.model,
    usage: {
      input_tokens: data.usage?.input_tokens || 0,
      output_tokens: data.usage?.output_tokens || 0,
    },
  }
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

export async function chat(messages: ChatMessage[]): Promise<LLMResponse> {
  const config = getConfig()

  try {
    if (config.provider === 'groq') {
      return await callGroq(messages, config)
    } else {
      return await callAnthropic(messages, config)
    }
  } catch (error) {
    // Fallback to other provider on error
    console.error(`${config.provider} failed, trying fallback:`, error)

    if (config.provider === 'groq' && process.env.ANTHROPIC_API_KEY) {
      return await callAnthropic(messages, ANTHROPIC_CONFIG)
    } else if (config.provider === 'anthropic' && process.env.GROQ_API_KEY) {
      return await callGroq(messages, GROQ_CONFIG)
    }

    throw error
  }
}
```

### 5.4 AI Prompts (`lib/prompts.ts`)

```typescript
import type { Wine } from '@/types'

// ============================================
// SYSTEM PROMPTS
// ============================================

export const SYSTEM_PROMPT_GENERAL = `Sei WYN, un sommelier AI esperto e amichevole.

RUOLO:
- Aiuti le persone a scoprire vini che ameranno
- Dai consigli su abbinamenti cibo-vino
- Spieghi le caratteristiche dei vini in modo accessibile

REGOLE:
- Rispondi SEMPRE in italiano
- Sii conciso ma informativo (max 2-3 paragrafi)
- NON inventare vini specifici o prezzi
- Puoi suggerire tipologie, regioni, vitigni
- Se non sai qualcosa, ammettilo

TONO:
- Amichevole ma professionale
- Appassionato di vino
- Mai snob o presuntuoso`

export function getVenueSystemPrompt(venueName: string, wines: Wine[]): string {
  const wineList = formatWineListForPrompt(wines)

  return `Sei WYN, il sommelier AI di ${venueName}.

RUOLO:
- Conosci SOLO i vini della carta del ristorante
- Aiuti i clienti a scegliere il vino perfetto
- Dai consigli su abbinamenti con i piatti del menu

CARTA DEI VINI DISPONIBILI:
${wineList}

REGOLE FONDAMENTALI:
1. Consiglia SOLO vini dalla lista sopra
2. Menziona SEMPRE il prezzo quando suggerisci un vino
3. Se un vino non è nella lista, dì che non è disponibile
4. Rispondi SEMPRE in italiano
5. Sii conciso (max 2-3 paragrafi)

TONO:
- Accogliente e professionale
- Come un cameriere esperto
- Mai invadente`
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function formatWineListForPrompt(wines: Wine[]): string {
  if (wines.length === 0) {
    return 'Nessun vino disponibile al momento.'
  }

  const grouped = groupWinesByType(wines)

  let result = ''
  for (const [type, typeWines] of Object.entries(grouped)) {
    const typeLabel = getTypeLabel(type as Wine['wine_type'])
    result += `\n### ${typeLabel}\n`

    for (const wine of typeWines) {
      result += formatWineForPrompt(wine)
    }
  }

  return result.trim()
}

function formatWineForPrompt(wine: Wine): string {
  const parts = [
    `- **${wine.name}**`,
    wine.year ? `(${wine.year})` : '',
    `- €${wine.price}/bottiglia`,
    wine.price_glass ? `, €${wine.price_glass}/calice` : '',
  ]

  const details = []
  if (wine.producer) details.push(wine.producer)
  if (wine.region) details.push(wine.region)
  if (wine.grape_varieties?.length) details.push(wine.grape_varieties.join(', '))

  if (details.length > 0) {
    parts.push(`\n  ${details.join(' | ')}`)
  }

  if (wine.description) {
    parts.push(`\n  ${wine.description}`)
  }

  return parts.join('') + '\n'
}

function groupWinesByType(wines: Wine[]): Record<string, Wine[]> {
  return wines.reduce((acc, wine) => {
    const type = wine.wine_type
    if (!acc[type]) acc[type] = []
    acc[type].push(wine)
    return acc
  }, {} as Record<string, Wine[]>)
}

function getTypeLabel(type: Wine['wine_type']): string {
  const labels: Record<Wine['wine_type'], string> = {
    red: 'Vini Rossi',
    white: 'Vini Bianchi',
    rose: 'Vini Rosé',
    sparkling: 'Spumanti',
    dessert: 'Vini da Dessert',
  }
  return labels[type]
}

// ============================================
// MESSAGE BUILDERS
// ============================================

export function buildChatMessages(
  userMessage: string,
  systemPrompt: string,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): { role: 'user' | 'assistant' | 'system'; content: string }[] {
  return [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage },
  ]
}
```

### 5.5 Utilities (`lib/utils.ts`)

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind class merger
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price in EUR
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(price)
}

// Format wine type for display
export function formatWineType(type: string): string {
  const labels: Record<string, string> = {
    red: 'Rosso',
    white: 'Bianco',
    rose: 'Rosé',
    sparkling: 'Spumante',
    dessert: 'Dessert',
  }
  return labels[type] || type
}

// Generate slug from string
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// Truncate text with ellipsis
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 3) + '...'
}

// Parse grape varieties from string
export function parseGrapeVarieties(input: string): string[] {
  return input
    .split(/[,;]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}
```

---

## 6. Implementation Steps

1. [ ] Update `types/index.ts` with complete type definitions
2. [ ] Update `lib/supabase.ts` with typed client and CRUD functions
3. [ ] Implement `lib/llm.ts` with Groq and Anthropic support
4. [ ] Implement `lib/prompts.ts` with system prompts
5. [ ] Update `lib/utils.ts` with utility functions
6. [ ] Test Supabase functions against seed data
7. [ ] Test LLM client with simple prompt
8. [ ] Verify error handling works correctly

---

## 7. Test Strategy

- **Unit Tests:** All lib functions with mocked dependencies
- **Integration:** Supabase queries against test database
- **LLM Test:** Simple chat completion (manual)

---

## 8. Rollback Plan

1. Revert file changes
2. No database changes in this plan
3. No breaking API changes

---

## 9. Review Checklist

- [ ] Types match database schema from PLAN-002
- [ ] Supabase functions cover all CRUD operations
- [ ] LLM client handles both providers
- [ ] Error handling is consistent
- [ ] Prompts follow CLAUDE.md business rules

---

**This plan provides the service layer for all features.**
