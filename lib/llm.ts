import type { ChatMessage, LLMConfig, LLMResponse } from '@/types'

// ============================================
// CONFIGURATION
// ============================================

const GROQ_CONFIG: LLMConfig = {
  provider: 'groq',
  model: 'llama-3.3-70b-versatile',
  maxTokens: 1024,
  temperature: 0.7,
}

const ANTHROPIC_CONFIG: LLMConfig = {
  provider: 'anthropic',
  model: 'claude-3-haiku-20240307',
  maxTokens: 1024,
  temperature: 0.7,
}

function getConfig(): LLMConfig {
  // Use Groq in development, Anthropic in production
  if (process.env.NODE_ENV === 'production' && process.env.ANTHROPIC_API_KEY) {
    return ANTHROPIC_CONFIG
  }
  if (process.env.GROQ_API_KEY) {
    return GROQ_CONFIG
  }
  // Fallback to Anthropic if available
  if (process.env.ANTHROPIC_API_KEY) {
    return ANTHROPIC_CONFIG
  }
  throw new Error('No LLM API key configured. Set GROQ_API_KEY or ANTHROPIC_API_KEY.')
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
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemMessage,
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
    console.error(`${config.provider} failed:`, error)

    // Try fallback provider
    if (config.provider === 'groq' && process.env.ANTHROPIC_API_KEY) {
      return await callAnthropic(messages, ANTHROPIC_CONFIG)
    } else if (config.provider === 'anthropic' && process.env.GROQ_API_KEY) {
      return await callGroq(messages, GROQ_CONFIG)
    }

    throw error
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getProviderInfo(): { provider: string; model: string } {
  try {
    const config = getConfig()
    return { provider: config.provider, model: config.model }
  } catch {
    return { provider: 'none', model: 'none' }
  }
}
