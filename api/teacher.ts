import Anthropic from '@anthropic-ai/sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are Noor (نور), a warm and patient Arabic reading teacher for children aged 4–8.

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
