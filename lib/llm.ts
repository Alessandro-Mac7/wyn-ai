/**
 * LLM module for text chat
 * Supports multiple providers: Groq (dev), OpenAI (prod), Anthropic (premium)
 *
 * Priority order:
 * 1. Groq (GROQ_API_KEY) - Free, fast, for development
 * 2. OpenAI (OPENAI_API_KEY) - Cost-effective production (gpt-4o-mini)
 * 3. Anthropic (ANTHROPIC_API_KEY) - Premium option (Claude)
 */

import type { ChatMessage, LLMConfig, LLMResponse } from '@/types'

// ============================================
// CONFIGURATION
// ============================================

type LLMProvider = 'groq' | 'openai' | 'anthropic'

const GROQ_CONFIG: LLMConfig = {
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  maxTokens: 1024,
  temperature: 0.7,
}

const OPENAI_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  maxTokens: 1024,
  temperature: 0.7,
}

const ANTHROPIC_CONFIG: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-3-haiku-20240307',
  maxTokens: 1024,
  temperature: 0.7,
}

/**
 * Determines which LLM provider to use based on available API keys
 * Priority: Groq (dev) → OpenAI (prod) → Anthropic (premium)
 */
function getConfig(): LLMConfig {
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // In development, prefer Groq (free)
  if (process.env.NODE_ENV !== 'production') {
    if (groqKey) return GROQ_CONFIG
    if (openaiKey) return OPENAI_CONFIG
    if (anthropicKey) return ANTHROPIC_CONFIG
  } else {
    // In production, prefer OpenAI (cost-effective), then Anthropic
    if (openaiKey) return OPENAI_CONFIG
    if (anthropicKey) return ANTHROPIC_CONFIG
    if (groqKey) return GROQ_CONFIG // Fallback to Groq if available
  }

  throw new Error('No LLM API key configured. Set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.')
}

/**
 * Get fallback config if primary provider fails
 */
function getFallbackConfig(currentProvider: LLMProvider): LLMConfig | null {
  const groqKey = process.env.GROQ_API_KEY
  const openaiKey = process.env.OPENAI_API_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  // Try providers in order, skipping the current one
  const fallbacks: { key: string | undefined; config: LLMConfig }[] = [
    { key: openaiKey, config: OPENAI_CONFIG },
    { key: anthropicKey, config: ANTHROPIC_CONFIG },
    { key: groqKey, config: GROQ_CONFIG },
  ]

  for (const { key, config } of fallbacks) {
    if (key && config.provider !== currentProvider) {
      return config
    }
  }

  return null
}

// ============================================
// GROQ CLIENT
// ============================================

async function callGroq(
  messages: ChatMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    const errorText = await response.text()
    console.error('Groq API error:', errorText)
    throw new Error(`Groq API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid Groq response format')
  }

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
// OPENAI CLIENT
// ============================================

async function callOpenAI(
  messages: ChatMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
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
    const errorText = await response.text()
    console.error('OpenAI API error:', errorText)
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('Invalid OpenAI response format')
  }

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
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Extract system message
  const systemMessage = messages.find(m => m.role === 'system')?.content || ''
  const userMessages = messages.filter(m => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: [
        {
          type: 'text',
          text: systemMessage,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: userMessages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Anthropic API error:', errorText)
    throw new Error(`Anthropic API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.content?.[0]?.text) {
    throw new Error('Invalid Anthropic response format')
  }

  const cacheCreated = data.usage?.cache_creation_input_tokens || 0
  const cacheRead = data.usage?.cache_read_input_tokens || 0
  if (cacheCreated || cacheRead) {
    console.log(`[LLM] Anthropic cache: created=${cacheCreated} read=${cacheRead}`)
  }

  return {
    content: data.content[0].text,
    model: data.model,
    usage: {
      input_tokens: data.usage?.input_tokens || 0,
      output_tokens: data.usage?.output_tokens || 0,
      cache_creation_input_tokens: cacheCreated,
      cache_read_input_tokens: cacheRead,
    },
  }
}

// ============================================
// MAIN CHAT FUNCTION
// ============================================

/**
 * Calls the appropriate provider based on configuration
 */
async function callProvider(
  messages: ChatMessage[],
  config: LLMConfig
): Promise<LLMResponse> {
  switch (config.provider) {
    case 'groq':
      return callGroq(messages, config)
    case 'openai':
      return callOpenAI(messages, config)
    case 'anthropic':
      return callAnthropic(messages, config)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

/**
 * Main chat function with automatic fallback
 */
export async function chat(messages: ChatMessage[]): Promise<LLMResponse> {
  const config = getConfig()

  console.log(`[LLM] Using ${config.provider} (${config.model})`)

  try {
    return await callProvider(messages, config)
  } catch (error) {
    console.error(`[LLM] ${config.provider} failed:`, error)

    // Try fallback provider
    const fallbackConfig = getFallbackConfig(config.provider as LLMProvider)
    if (fallbackConfig) {
      console.log(`[LLM] Falling back to ${fallbackConfig.provider} (${fallbackConfig.model})`)
      return await callProvider(messages, fallbackConfig)
    }

    throw error
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Returns current provider info for debugging
 */
export function getProviderInfo(): { provider: string; model: string } {
  try {
    const config = getConfig()
    return { provider: config.provider, model: config.model }
  } catch {
    return { provider: 'none', model: 'none' }
  }
}

/**
 * Returns all available providers based on configured API keys
 */
export function getAvailableProviders(): LLMProvider[] {
  const providers: LLMProvider[] = []

  if (process.env.GROQ_API_KEY) providers.push('groq')
  if (process.env.OPENAI_API_KEY) providers.push('openai')
  if (process.env.ANTHROPIC_API_KEY) providers.push('anthropic')

  return providers
}
