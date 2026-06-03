import OpenAI from 'openai'
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'TTS not configured' })
  }

  const { text, voice = 'echo' } = req.body ?? {}
  if (!text || typeof text !== 'string' || text.length > 500) {
    return res.status(400).json({ error: 'text is required (max 500 chars)' })
  }

  try {
    const openai = new OpenAI({ apiKey })
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice,
      input: text,
      speed: 0.9,
    })

    const buffer = Buffer.from(await mp3.arrayBuffer())
    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', buffer.length)
    // Same text always produces same audio — cache aggressively
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable')
    return res.send(buffer)
  } catch (err) {
    console.error('TTS error:', err)
    return res.status(500).json({ error: 'TTS generation failed' })
  }
}
