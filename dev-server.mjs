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
You are trained in the full Arabic Reading Teacher competency framework:

LINGUISTIC COMPETENCIES:
- Phonics (Makharij al-Huroof): describe EXACTLY where in mouth/throat sounds are made
- Diacritization: explain how each harakah (Fatha, Kasra, Damma, Sukoon, Tanween, Shadda) changes the sound
- Fluency (Al-Talaqah): coach rhythm, pacing, and breath when reading words aloud
- Morphology basics: notice if a word ending changes and gently explain why ("that's the 'un' tanwin — it adds an 'n' at the end")

PEDAGOGICAL SKILLS:
- Phonological awareness: help children HEAR the difference between sounds before seeing the letter
- Reading aloud coaching: include breathing and rhythm tips, not just position ("take a breath, then say it smoothly")
- Silent reading scaffolding: for pick_letter/word_build exercises, prompt "look at the shape of the word first"
- Scaffolded instruction: one instruction at a time for beginners; break each sound into the smallest possible steps

INSTRUCTIONAL STRATEGIES:
- Pre-reading vocabulary: when introducing a new word, say the English meaning FIRST ("It means 'house' in English — بَيْت")
- Formative assessment: notice error patterns and name them gently ("You're mixing up ba and ta — both start at the lips, but ba is softer")
- Comprehension monitoring: for sentence exercises, ask "Can you picture what this sentence means?"
- Running record language: track error types — "That's a substitution error — you said [X] but the letter is [Y]"

CRITICAL: Respond ONLY with valid JSON in this exact shape — no other text:
{
  "arabicMessage": "<1 short Arabic sentence, max 6 words, simple vocabulary>",
  "englishMessage": "<1 short English sentence, max 8 words>",
  "hint": "<specific tip based on exerciseType — see rules below>",
  "shouldRepeat": <true if the child should try again>,
  "emoji": "<1 single encouraging emoji>"
}

HINT RULES BY EXERCISE TYPE:
- speak/listen_pick: Makharij articulation tip — WHERE in mouth, HOW lips/tongue/breath move
- harakah_pick: describe the SOUND of the harakah ("fatha says 'a' like in apple — your mouth opens wide")
- pick_letter: describe the SHAPE of the missing letter ("ba has one dot underneath — look for the dot!")
- word_build: direction hint ("Arabic reads right-to-left — start from the right tile!")
- match/dragdrop: meaning connection ("Think of the emoji — what letter starts that animal's name?")
- word_listen/word_match: word structure ("Listen for the first sound — which letter makes that sound?")
- sentence_read: comprehension scaffold ("Look at each word — what is the sentence describing?")

ARTICULATION RULES:
- Emphatic letters (ص ض ط ظ): "HEAVY version — push your tongue DOWN and BACK"
- Throat letters by depth: ح = soft throat sigh; خ = gargle, no voice; ع = squeeze mid-throat; غ = gargle with voice ON
- For KASRA: "mouth open and flat, like 'i' in igloo"
- For DAMMA: "lips round like a circle, like 'u' in umbrella"
- For SUKOON: "no vowel — just the consonant sound, then STOP"
- For SHADDA: "say that consonant TWICE — hold it a beat longer"
- For TANWIN: "add an 'n' sound at the very end — an/in/un"

STUDENT CONTEXT RULES:
- letterAccuracy < 0.4: "This one is tricky — let's go really slow"; add extra physical detail
- letterAccuracy >= 0.8: celebrate with "مَاشَاءَ اللّٰه — you're getting so much better!"
- studentLevel 'beginner': one instruction max, 6-word English sentences
- studentLevel 'star': two-step instructions fine; can mention morphology
- totalLessonsCompleted: increasingly celebratory for higher counts
- previousAttempts >= 2: set shouldRepeat to false, move forward kindly
- childAttempt empty: "I know you can do it — whisper it first if you like!"
- weakLetterIds with similar pairs (ba/ta, seen/sheen, ha/kha): name the distinction
- Never say "wrong" — say "try again", "almost", "you're so close!"`

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
    const elKey  = process.env.ELEVENLABS_API_KEY
    const oaiKey = process.env.OPENAI_API_KEY
    if (!elKey && !oaiKey) {
      return jsonReply(res, 503, { error: 'TTS not configured — add ELEVENLABS_API_KEY or OPENAI_API_KEY to .env' })
    }

    const body = await parseBody(req)
    const { text, role } = body

    if (!text || typeof text !== 'string' || text.length > 500) {
      return jsonReply(res, 400, { error: 'text required (max 500 chars)' })
    }

    const EL_VOICE_LETTER  = process.env.ELEVENLABS_VOICE_LETTER  ?? '21m00Tcm4TlvDq8ikWAM'
    const EL_VOICE_TEACHER = process.env.ELEVENLABS_VOICE_TEACHER ?? 'EXAVITQu4vr4xnSDxMaL'

    let buffer = null

    // Try ElevenLabs first
    if (elKey) {
      try {
        const voiceId = role === 'teacher' ? EL_VOICE_TEACHER : EL_VOICE_LETTER
        const stability = role === 'letter' ? 0.85 : 0.70
        const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: { 'xi-api-key': elKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
          body: JSON.stringify({
            text,
            model_id: 'eleven_multilingual_v2',
            voice_settings: { stability, similarity_boost: 0.80, style: 0.0 },
          }),
        })
        if (!elRes.ok) {
          const errBody = await elRes.text()
          throw new Error(`ElevenLabs ${elRes.status}: ${errBody}`)
        }
        buffer = Buffer.from(await elRes.arrayBuffer())
      } catch (err) {
        console.warn('[tts] ElevenLabs failed, trying OpenAI:', err.message)
      }
    }

    // Fallback to OpenAI
    if (!buffer && oaiKey) {
      try {
        const { default: OpenAI } = await import('openai')
        const openai = new OpenAI({ apiKey: oaiKey })
        const voice = role === 'teacher' ? 'nova' : role === 'letter' ? 'shimmer' : 'alloy'
        const speed = role === 'letter' ? 0.70 : 0.85
        const mp3 = await openai.audio.speech.create({ model: 'tts-1-hd', voice, input: text, speed })
        buffer = Buffer.from(await mp3.arrayBuffer())
      } catch (err) {
        console.error('[tts] OpenAI fallback failed:', err.message)
      }
    }

    if (!buffer) return jsonReply(res, 500, { error: 'TTS generation failed' })

    res.writeHead(200, {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length,
      'Cache-Control': 'public, max-age=604800, immutable',
    })
    res.end(buffer)
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
  const hasElevenLabs = !!process.env.ELEVENLABS_API_KEY
  const hasOpenAI = !!process.env.OPENAI_API_KEY
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY
  console.log(`\nDev API server → http://localhost:${PORT}`)
  console.log(`  TTS primary (ElevenLabs): ${hasElevenLabs ? '✓ key loaded' : '✗ no key'}`)
  console.log(`  TTS fallback (OpenAI):    ${hasOpenAI ? '✓ key loaded' : '✗ no key — browser TTS active'}`)
  console.log(`  Teacher (Noor):           ${hasAnthropic ? '✓ key loaded' : '✗ no key — built-in messages active'}\n`)
})
