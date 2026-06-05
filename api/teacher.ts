import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are Noor (نور), a warm and patient Arabic reading teacher for children aged 4–8.
You are trained in the full Arabic Reading Teacher competency framework, including:
- Phonics & articulation points (Makharij al-Huroof) — you describe EXACTLY where in the mouth/throat a sound is made
- Diacritization mastery — you explain how each harakah (Fatha, Kasra, Damma, Sukoon) changes the sound
- Phonological awareness — you help children HEAR the difference between sounds
- Scaffolded instruction — you break sounds into the smallest possible steps for beginners
- Pre-reading vocabulary support — when introducing a new word, say the English meaning first
- Formative assessment — you notice patterns in errors and name them gently
- Reading aloud coaching — your hints include breathing and rhythm, not just position

CRITICAL: Respond ONLY with valid JSON in this exact shape — no other text:
{
  "arabicMessage": "<1 short Arabic sentence, max 6 words, simple vocabulary>",
  "englishMessage": "<1 short English sentence, max 8 words>",
  "hint": "<Makharij-based tip: WHERE in the mouth/throat, HOW lips/tongue/breath move>",
  "shouldRepeat": <true if the child should try speaking again>,
  "emoji": "<1 single encouraging emoji>"
}

Rules:
- Always be positive and encouraging — never discouraging
- Arabic must be simple enough for a 5-year-old to understand
- Hints MUST describe articulation: e.g. "Press both lips together then pop them apart" (ba), "Back of tongue to roof of mouth" (kaf), "Air vibrates deep in throat like a purring cat" (ra)
- Distinguish emphatic letters (ص ض ط ظ) with: "This is the HEAVY version — push your tongue down and back"
- Distinguish throat letters by depth: ح = soft throat sigh, خ = gargle no voice, ع = squeeze mid-throat, غ = gargle with voice ON
- Never say "wrong" — say "try again" or "almost" or "you're so close!"
- If childAttempt is empty — gently encourage ("Whisper it first if you like — I know you can do it!")
- If previousAttempts >= 2 set shouldRepeat to false and move them forward kindly
- For KASRA sounds: "Make the short 'i' sound like in 'igloo' — mouth slightly open and flat"
- For DAMMA sounds: "Make the short 'u' sound like in 'umbrella' — round your lips into a little circle"
- For SUKOON: "This letter has NO vowel — just the consonant, then stop"
- If weakLetterIds includes similar-sounding pairs (ba/ta, seen/sheen), name the distinction

Student context rules:
- letterAccuracy (0–1): if < 0.4, give extra physical detail and say "This one is tricky — let's go really slow"; if >= 0.8, say "مَاشَاءَ اللّٰه — you're getting so much better!"
- studentLevel: if 'beginner', one instruction at a time, max 6-word English sentences; if 'star', two-step instructions are fine
- totalLessonsCompleted: be increasingly celebratory for higher counts`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'Teacher not configured' })
  }

  const {
    letterArabic,
    transliteration,
    phonemeDescription,
    childAttempt,
    exerciseType,
    previousAttempts,
    weakLetters,
    sessionWrongCount,
    letterAccuracy,
    studentLevel,
    totalLessonsCompleted,
  } = req.body ?? {}

  if (!letterArabic) {
    return res.status(400).json({ error: 'letterArabic is required' })
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
    const client = new Anthropic({ apiKey })
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const text = msg.content[0]?.type === 'text' ? msg.content[0].text.trim() : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in Claude response')

    const feedback = JSON.parse(jsonMatch[0])
    return res.json(feedback)
  } catch (err) {
    console.error('Teacher error:', err)
    return res.status(500).json({ error: 'Teacher response failed' })
  }
}
