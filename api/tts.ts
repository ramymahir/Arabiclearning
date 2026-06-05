import type { VercelRequest, VercelResponse } from '@vercel/node'

const EL_VOICE_LETTER  = process.env.ELEVENLABS_VOICE_LETTER  ?? '21m00Tcm4TlvDq8ikWAM'  // Rachel
const EL_VOICE_TEACHER = process.env.ELEVENLABS_VOICE_TEACHER ?? 'EXAVITQu4vr4xnSDxMaL'  // Bella

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { text, voice: _voice, role } = req.body ?? {}
  if (!text || typeof text !== 'string' || text.length > 500) {
    return res.status(400).json({ error: 'text is required (max 500 chars)' })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'TTS not configured — add ELEVENLABS_API_KEY' })

  const voiceId = role === 'teacher' ? EL_VOICE_TEACHER : EL_VOICE_LETTER
  const stability = role === 'letter' ? 0.85 : 0.70

  const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
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

  if (!elRes.ok) {
    const detail = await elRes.text()
    console.error('[tts] ElevenLabs error:', elRes.status, detail)
    return res.status(502).json({ error: `ElevenLabs ${elRes.status}`, detail })
  }

  const buffer = Buffer.from(await elRes.arrayBuffer())
  res.setHeader('Content-Type', 'audio/mpeg')
  res.setHeader('Content-Length', buffer.length)
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
  return res.send(buffer)
}
