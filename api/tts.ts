import type { VercelRequest, VercelResponse } from '@vercel/node'

// ElevenLabs voice IDs — overridable via env vars
// eleven_multilingual_v2 handles Arabic with high fidelity
const EL_VOICE_LETTER  = process.env.ELEVENLABS_VOICE_LETTER  ?? '21m00Tcm4TlvDq8ikWAM'  // Rachel
const EL_VOICE_TEACHER = process.env.ELEVENLABS_VOICE_TEACHER ?? 'EXAVITQu4vr4xnSDxMaL'  // Bella

async function elevenlabsTTS(text: string, role: string, apiKey: string): Promise<Buffer> {
  const voiceId = role === 'teacher' ? EL_VOICE_TEACHER : EL_VOICE_LETTER
  const stability = role === 'letter' ? 0.85 : 0.70

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability, similarity_boost: 0.80, style: 0.0 },
    }),
  })
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`)
  return Buffer.from(await res.arrayBuffer())
}

async function openaiTTS(text: string, role: string, apiKey: string): Promise<Buffer> {
  const { default: OpenAI } = await import('openai')
  const openai = new OpenAI({ apiKey })
  const voice = role === 'teacher' ? 'nova' : role === 'letter' ? 'shimmer' : 'alloy'
  const speed = role === 'letter' ? 0.70 : 0.85
  const mp3 = await openai.audio.speech.create({ model: 'tts-1-hd', voice, input: text, speed })
  return Buffer.from(await mp3.arrayBuffer())
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text, voice: _voice, role } = req.body ?? {}
  if (!text || typeof text !== 'string' || text.length > 500) {
    return res.status(400).json({ error: 'text is required (max 500 chars)' })
  }

  const elKey = process.env.ELEVENLABS_API_KEY
  const oaiKey = process.env.OPENAI_API_KEY

  if (!elKey && !oaiKey) return res.status(503).json({ error: 'TTS not configured' })

  let buffer: Buffer | null = null
  let error: string | null = null

  // Try ElevenLabs first (better Arabic pronunciation)
  if (elKey) {
    try {
      buffer = await elevenlabsTTS(text, role ?? 'letter', elKey)
    } catch (err) {
      error = (err as Error).message
      console.warn('[tts] ElevenLabs failed, trying OpenAI fallback:', error)
    }
  }

  // Fall back to OpenAI
  if (!buffer && oaiKey) {
    try {
      buffer = await openaiTTS(text, role ?? 'letter', oaiKey)
    } catch (err) {
      error = (err as Error).message
      console.error('[tts] OpenAI fallback also failed:', error)
    }
  }

  if (!buffer) return res.status(500).json({ error: 'TTS generation failed', detail: error })

  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Length', buffer.length)
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
  return res.send(buffer)
}
