#!/usr/bin/env node
/**
 * Local dev API server — replaces Vercel CLI for local development.
 * Handles /api/tts and /api/teacher on port 3001.
 * Run via: npm run dev:api  (or npm run dev:full to start both this + Vite)
 */
import http from 'http'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load .env manually (works on all Node versions)
const envFile = join(__dirname, '.env')
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim()
    }
  }
}

function parseBody(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { resolve({}) }
    })
  })
}

function jsonReply(res, status, body) {
  const str = JSON.stringify(body)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(str),
  })
  res.end(str)
}

const TEACHER_SYSTEM = `You are Noor (نور), a warm and patient Arabic reading teacher for children aged 4–8.

CRITICAL: Respond ONLY with valid JSON in this exact shape — no other text:
{
  "arabicMessage": "<1 short Arabic sentence, max 6 words, simple vocabulary>",
  "englishMessage": "<1 short English sentence, max 8 words>",
  "hint": "<concrete pronunciation tip, e.g. 'Touch your top teeth with your tongue'>",
  "shouldRepeat": <true if the child should try speaking again>,
  "emoji": "<1 single encouraging emoji>"
}

Rules:
- Always be positive and encouraging — never discouraging
- Arabic must be simple enough for a 5-year-old to understand
- Hints describe mouth/tongue/lip/breath position concretely
- Never say "wrong" — say "try again" or "almost"
- If childAttempt is empty the child was silent — gently encourage them to try
- If previousAttempts >= 2 set shouldRepeat to false and move them forward kindly

Student context rules:
- letterAccuracy (0–1): if < 0.4, give extra physical detail and say "This one is tricky — let's go slow"; if >= 0.8, acknowledge progress with "مَاشَاءَ اللّٰه" or similar praise
- studentLevel: if 'beginner', use max 6-word English sentences and be extra gentle; if 'star', slightly more detail is fine
- totalLessonsCompleted: be more celebratory for higher counts`

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    return jsonReply(res, 405, { error: 'Method not allowed' })
  }

  // ── POST /api/tts ─────────────────────────────────────────────────────
  if (req.url === '/api/tts') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return jsonReply(res, 503, { error: 'TTS not configured — add OPENAI_API_KEY to .env' })
    }

    const body = await parseBody(req)
    const { text, voice, role } = body
    const resolvedVoice = voice ?? (role === 'teacher' ? 'nova' : role === 'letter' ? 'shimmer' : 'alloy')
    const resolvedSpeed = role === 'letter' ? 0.70 : 0.85

    if (!text || typeof text !== 'string' || text.length > 500) {
      return jsonReply(res, 400, { error: 'text required (max 500 chars)' })
    }

    try {
      const { default: OpenAI } = await import('openai')
      const openai = new OpenAI({ apiKey })
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1-hd',
        voice: resolvedVoice,
        input: text,
        speed: resolvedSpeed,
      })
      const buffer = Buffer.from(await mp3.arrayBuffer())
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length,
        'Cache-Control': 'public, max-age=604800, immutable',
      })
      res.end(buffer)
    } catch (err) {
      console.error('[tts] Error:', err.message)
      return jsonReply(res, 500, { error: 'TTS generation failed' })
    }
    return
  }

  // ── POST /api/teacher ─────────────────────────────────────────────────
  if (req.url === '/api/teacher') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return jsonReply(res, 503, { error: 'Teacher not configured — add ANTHROPIC_API_KEY to .env' })
    }

    const body = await parseBody(req)
    const {
      letterArabic, transliteration, phonemeDescription,
      childAttempt, exerciseType, previousAttempts,
      weakLetters, sessionWrongCount,
      letterAccuracy, studentLevel, totalLessonsCompleted,
    } = body

    if (!letterArabic) {
      return jsonReply(res, 400, { error: 'letterArabic is required' })
    }

    const userMessage = JSON.stringify({
      letter: letterArabic,
      transliteration,
      phonemeDescription,
      childAttempt: childAttempt ?? '',
      exerciseType,
      previousAttempts: previousAttempts ?? 0,
      weakLetterIds: weakLetters ?? [],
      sessionWrongCount: sessionWrongCount ?? 0,
      letterAccuracy: letterAccuracy ?? null,
      studentLevel: studentLevel ?? 'beginner',
      totalLessonsCompleted: totalLessonsCompleted ?? 0,
    })

    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk')
      const client = new Anthropic({ apiKey })
      const msg = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        system: TEACHER_SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      })

      const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('No JSON in response')

      return jsonReply(res, 200, JSON.parse(jsonMatch[0]))
    } catch (err) {
      console.error('[teacher] Error:', err.message)
      return jsonReply(res, 500, { error: 'Teacher response failed' })
    }
  }

  return jsonReply(res, 404, { error: 'Not found' })
})

const PORT = 3001
server.listen(PORT, () => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  console.log(`\nDev API server → http://localhost:${PORT}`)
  console.log(`  TTS (OpenAI):   ${hasOpenAI ? '✓ key loaded' : '✗ no key — browser TTS fallback active'}`)
  console.log(`  Teacher (Noor): ${hasAnthropic ? '✓ key loaded' : '✗ no key — built-in messages active'}\n`)
})
