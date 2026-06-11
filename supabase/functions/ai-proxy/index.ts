/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const SECRETS: Record<string, string | undefined> = {
  google:     Deno.env.get('GEMINI_API_KEY'),
  tts:        Deno.env.get('GOOGLE_TTS_KEY') || Deno.env.get('GEMINI_API_KEY'),
  anthropic:  Deno.env.get('ANTHROPIC_API_KEY'),
  openai:     Deno.env.get('OPENAI_API_KEY'),
  groq:       Deno.env.get('GROQ_API_KEY'),
  deepseek:   Deno.env.get('DEEPSEEK_API_KEY'),
  mistral:    Deno.env.get('MISTRAL_API_KEY'),
  openrouter: Deno.env.get('OPENROUTER_API_KEY'),
  nemotron:   Deno.env.get('NEMOTRON_API_KEY'),
  glm:        Deno.env.get('GLM_API_KEY'),
}

const TTS_SA_JSON: string | undefined = Deno.env.get('GOOGLE_TTS_SA_KEY')

const BASE_URLS: Record<string, string> = {
  openai:     'https://api.openai.com/v1',
  groq:       'https://api.groq.com/openai/v1',
  deepseek:   'https://api.deepseek.com',
  mistral:    'https://api.mistral.ai/v1',
  openrouter: 'https://openrouter.ai/api/v1',
  nemotron:   'https://integrate.api.nvidia.com/v1',
  glm:        'https://open.bigmodel.cn/api/paas/v4',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface ProxyRequest {
  provider: string
  modelId: string
  prompt: string
  systemInstruction?: string
  stream?: boolean
  baseUrl?: string
  temperature?: number
  maxTokens?: number
  // TTS-specific (provider='tts'): modelId=voiceName, prompt=text, temperature=speakingRate
}

// ─── Service Account JWT helpers ─────────────────────────────────────────────

interface TokenCache {
  token: string
  expiresAt: number
}

let _tokenCache: TokenCache | null = null

function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function b64url(input: ArrayBuffer | string): string {
  let binary: string
  if (typeof input === 'string') {
    // encode UTF-8 string
    binary = btoa(unescape(encodeURIComponent(input)))
  } else {
    const bytes = new Uint8Array(input)
    binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    binary = btoa(binary)
  }
  return binary.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
}

async function getServiceAccountToken(): Promise<string | null> {
  if (!TTS_SA_JSON) return null

  const now = Math.floor(Date.now() / 1000)

  // Return cached token if valid with 5-minute buffer
  if (_tokenCache && _tokenCache.expiresAt > now + 300) {
    return _tokenCache.token
  }

  let sa: any
  try {
    sa = JSON.parse(TTS_SA_JSON)
  } catch {
    console.error('GOOGLE_TTS_SA_KEY is not valid JSON')
    return null
  }

  const iat = now
  const exp = iat + 3600

  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud:   sa.token_uri || 'https://oauth2.googleapis.com/token',
    exp,
    iat,
  }))

  const signingInput = `${header}.${payload}`

  let cryptoKey: CryptoKey
  try {
    const der = pemToDer(sa.private_key)
    cryptoKey = await crypto.subtle.importKey(
      'pkcs8', der,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['sign']
    )
  } catch (e) {
    console.error('Failed to import service account private key:', e)
    return null
  }

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', cryptoKey,
    new TextEncoder().encode(signingInput)
  )

  const jwt = `${signingInput}.${b64url(signature)}`

  const tokenRes = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })

  if (!tokenRes.ok) {
    console.error('Token exchange failed:', tokenRes.status, await tokenRes.text())
    return null
  }

  const tokenData = await tokenRes.json()
  const accessToken: string | undefined = tokenData.access_token
  if (!accessToken) return null

  _tokenCache = { token: accessToken, expiresAt: exp }
  return accessToken
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: ProxyRequest = await req.json()
    const {
      provider,
      modelId,
      prompt,
      systemInstruction,
      stream = false,
      baseUrl,
      temperature = 0.7,
      maxTokens = 8192,
    } = body

    if (!provider || !prompt) {
      return errRes('Missing required fields: provider, prompt', 400)
    }

    // ── Google Chirp 3 HD Text-to-Speech ───────────────────────────────────
    if (provider === 'tts') {
      return googleChirpTTS(prompt, modelId || 'nl-NL-Chirp3-HD-Charon', temperature ?? 1.1)
    }

    if (!modelId) return errRes('Missing required field: modelId', 400)

    if (provider === 'google') {
      return stream
        ? googleStream(modelId, prompt, systemInstruction, temperature, maxTokens)
        : google(modelId, prompt, systemInstruction, temperature, maxTokens)
    }

    if (provider === 'anthropic') {
      return stream
        ? anthropicStream(modelId, prompt, systemInstruction, temperature, maxTokens)
        : anthropic(modelId, prompt, systemInstruction, temperature, maxTokens)
    }

    // OpenAI-compatible providers
    return stream
      ? genericStream(provider, modelId, prompt, systemInstruction, temperature, maxTokens, baseUrl)
      : generic(provider, modelId, prompt, systemInstruction, temperature, maxTokens, baseUrl)

  } catch (error: any) {
    return errRes(error?.message ?? 'Unknown error', 500)
  }
})

// ─── Google Gemini ────────────────────────────────────────────────────────────

async function google(
  modelId: string, prompt: string, systemInstruction?: string,
  temperature = 0.7, maxTokens = 2048
): Promise<Response> {
  const apiKey = SECRETS.google
  if (!apiKey) return errRes('Google API key not set on server', 503)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`
  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  }
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) return errRes(`Google ${res.status}: ${await res.text()}`, res.status)
  const data = await res.json()
  return okRes({ content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '' })
}

async function googleStream(
  modelId: string, prompt: string, systemInstruction?: string,
  temperature = 0.7, maxTokens = 2048
): Promise<Response> {
  const apiKey = SECRETS.google
  if (!apiKey) return errRes('Google API key not set on server', 503)

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?key=${apiKey}&alt=sse`
  const body: any = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  }
  if (systemInstruction) body.systemInstruction = { parts: [{ text: systemInstruction }] }

  const upstream = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!upstream.ok || !upstream.body) return errRes(`Google stream ${upstream.status}`, upstream.status)

  return sseTransform(upstream.body, (line) => {
    try {
      const parsed = JSON.parse(line)
      return parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } catch { return '' }
  })
}

// ─── Anthropic ────────────────────────────────────────────────────────────────

async function anthropic(
  modelId: string, prompt: string, systemInstruction?: string,
  temperature = 0.7, maxTokens = 2048
): Promise<Response> {
  const apiKey = SECRETS.anthropic
  if (!apiKey) return errRes('Anthropic API key not set on server', 503)

  const body: any = {
    model: modelId,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
    temperature,
  }
  if (systemInstruction) body.system = systemInstruction

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) return errRes(`Anthropic ${res.status}: ${await res.text()}`, res.status)
  const data = await res.json()
  return okRes({ content: data.content?.[0]?.text ?? '' })
}

async function anthropicStream(
  modelId: string, prompt: string, systemInstruction?: string,
  temperature = 0.7, maxTokens = 2048
): Promise<Response> {
  const apiKey = SECRETS.anthropic
  if (!apiKey) return errRes('Anthropic API key not set on server', 503)

  const body: any = {
    model: modelId,
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
    temperature,
    stream: true,
  }
  if (systemInstruction) body.system = systemInstruction

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!upstream.ok || !upstream.body) return errRes(`Anthropic stream ${upstream.status}`, upstream.status)

  return sseTransform(upstream.body, (line) => {
    try {
      const parsed = JSON.parse(line)
      return parsed.type === 'content_block_delta' ? (parsed.delta?.text ?? '') : ''
    } catch { return '' }
  })
}

// ─── OpenAI-compatible ────────────────────────────────────────────────────────

async function generic(
  provider: string, modelId: string, prompt: string, systemInstruction?: string,
  temperature = 0.7, maxTokens = 2048, customBaseUrl?: string
): Promise<Response> {
  const apiKey = SECRETS[provider]
  const baseUrl = customBaseUrl || BASE_URLS[provider]
  if (!apiKey) return errRes(`${provider} API key not set on server`, 503)
  if (!baseUrl) return errRes(`Unknown provider: ${provider}`, 400)

  const messages: any[] = []
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction })
  messages.push({ role: 'user', content: prompt })

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, messages, temperature, max_tokens: maxTokens }),
  })
  if (!res.ok) return errRes(`${provider} ${res.status}: ${await res.text()}`, res.status)
  const data = await res.json()
  return okRes({ content: data.choices?.[0]?.message?.content ?? '' })
}

async function genericStream(
  provider: string, modelId: string, prompt: string, systemInstruction?: string,
  temperature = 0.7, maxTokens = 2048, customBaseUrl?: string
): Promise<Response> {
  const apiKey = SECRETS[provider]
  const baseUrl = customBaseUrl || BASE_URLS[provider]
  if (!apiKey) return errRes(`${provider} API key not set on server`, 503)
  if (!baseUrl) return errRes(`Unknown provider: ${provider}`, 400)

  const messages: any[] = []
  if (systemInstruction) messages.push({ role: 'system', content: systemInstruction })
  messages.push({ role: 'user', content: prompt })

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, messages, temperature, max_tokens: maxTokens, stream: true }),
  })
  if (!upstream.ok || !upstream.body) return errRes(`${provider} stream ${upstream.status}`, upstream.status)

  return sseTransform(upstream.body, (line) => {
    try {
      const parsed = JSON.parse(line)
      return parsed.choices?.[0]?.delta?.content ?? ''
    } catch { return '' }
  })
}

// ─── Shared SSE transformer ───────────────────────────────────────────────────

function sseTransform(
  upstreamBody: ReadableStream<Uint8Array>,
  extractText: (line: string) => string
): Response {
  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder();

  (async () => {
    const reader = upstreamBody.getReader()
    let buffer = ''
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (!payload || payload === '[DONE]') continue
          const text = extractText(payload)
          if (text) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ content: text })}\n\n`))
          }
        }
      }
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'))
      await writer.close().catch(() => {})
    }
  })()

  return new Response(readable, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

// ─── Google Chirp 3 HD Text-to-Speech ────────────────────────────────────────

async function googleChirpTTS(
  text: string,
  voiceName: string,
  speakingRate: number
): Promise<Response> {
  // Prefer service account auth; fall back to API key
  const saToken = await getServiceAccountToken()

  let url: string
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }

  if (saToken) {
    url = 'https://texttospeech.googleapis.com/v1/text:synthesize'
    headers['Authorization'] = `Bearer ${saToken}`
  } else {
    const apiKey = SECRETS.tts
    if (!apiKey) return errRes('Google TTS: geen GOOGLE_TTS_SA_KEY of GOOGLE_TTS_KEY geconfigureerd', 503)
    url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: 'nl-NL', name: voiceName },
      audioConfig: { audioEncoding: 'MP3', speakingRate },
    }),
  })
  if (!res.ok) return errRes(`Google TTS ${res.status}: ${await res.text()}`, res.status)
  const data = await res.json()
  return okRes({ audioContent: data.audioContent ?? '' })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function okRes(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function errRes(message: string, status = 500): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
