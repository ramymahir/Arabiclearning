import type { LessonExercise, Harakah } from '@/types'
import { ARABIC_LETTERS, getLetterById } from './letters'
import { getSentencesForLesson } from './sentences'
import { getExampleByHarakah } from '@/utils/arabic'

export interface LetterMastery { accuracy: number; attempts: number }

/**
 * Deterministic distractor selection seeded by correctId.
 * Returns `count` letter IDs from all 28 letters, excluding lessonLetterIds.
 */
function getDistractors(correctId: string, lessonLetterIds: string[], count = 3): string[] {
  // Prefer letters outside this lesson first, then fall back to other lesson letters
  const outsideLesson = ARABIC_LETTERS.filter((l) => !lessonLetterIds.includes(l.id))
  const insideLesson = ARABIC_LETTERS.filter(
    (l) => lessonLetterIds.includes(l.id) && l.id !== correctId
  )

  // Deterministic shuffle seeded by correctId to avoid hydration mismatches
  const seed = correctId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const deterministicSort = (arr: typeof ARABIC_LETTERS) =>
    [...arr].sort((a, b) => {
      const ha = (seed * (a.order + 1) * 2654435761) >>> 0
      const hb = (seed * (b.order + 1) * 2654435761) >>> 0
      return ha - hb
    })

  const pool = [...deterministicSort(outsideLesson), ...deterministicSort(insideLesson)]

  const result: string[] = []
  for (const l of pool) {
    if (result.length >= count) break
    result.push(l.id)
  }

  // Fallback: fill from any letter not already picked
  while (result.length < count) {
    const fallback = ARABIC_LETTERS.find(
      (l) => l.id !== correctId && !result.includes(l.id)
    )
    if (fallback) result.push(fallback.id)
    else break
  }

  return result.slice(0, count)
}

/**
 * Generate exercises for a lesson following this exact pattern:
 *
 * For each letter (in order):
 *   1. teach  — show the letter
 *   2. speak  — "Say the letter!" (immediately after teach)
 *
 * Then after ALL letters have been taught+spoken:
 *   3. listen_pick per letter — hear → pick from 4 choices
 *   4. match per letter       — see letter → pick word
 *   5. dragdrop (one total)   — drag all letters to their words
 */
export function generateLessonExercises(
  letterIds: string[],
  harakah: Harakah,
  lessonId?: number
): LessonExercise[] {
  const exercises: LessonExercise[] = []

  // ── Phase 1: teach + speak pairs (one per letter, in order) ──────────────
  for (let i = 0; i < letterIds.length; i++) {
    const id = letterIds[i]
    const letter = getLetterById(id)
    if (!letter) continue

    exercises.push({
      id: `teach_${id}`,
      type: 'teach',
      letterId: id,
      correctAnswer: id,
      distractors: [],
    })

    // speak immediately follows teach — no heart penalty, just voice practice
    exercises.push({
      id: `speak_${id}_${i}`,
      type: 'speak',
      letterId: id,
      correctAnswer: id,
      distractors: [],
      promptText: 'Say the letter!',
    })
  }

  // ── Phase 2: listen_pick — one per letter (in original order) ────────────
  for (const id of letterIds) {
    exercises.push({
      id: `listen_${id}`,
      type: 'listen_pick',
      letterId: id,
      correctAnswer: id,
      distractors: getDistractors(id, letterIds),
      promptText: 'Which letter do you hear?',
    })
  }

  // ── Phase 3: match — one per letter (in original order) ──────────────────
  for (const id of letterIds) {
    const letter = getLetterById(id)
    if (!letter || letter.examples.length === 0) continue
    exercises.push({
      id: `match_${id}`,
      type: 'match',
      letterId: id,
      correctAnswer: id,
      distractors: getDistractors(id, letterIds),
      wordExample: getExampleByHarakah(letter, harakah),
    })
  }

  // ── Phase 4: one dragdrop for the whole lesson ───────────────────────────
  const suffix = lessonId !== undefined ? String(lessonId) : 'all'
  exercises.push({
    id: `dragdrop_${suffix}`,
    type: 'dragdrop',
    letterId: letterIds[0],
    correctAnswer: letterIds.join(','),
    distractors: [],
  })

  // ── Phase 5: word_listen — hear a word, pick correct Arabic spelling ──────
  const wlLetter = getLetterById(letterIds[0])
  if (wlLetter && wlLetter.examples.length > 0) {
    const correctWord = getExampleByHarakah(wlLetter, harakah)
    const distractorWords = letterIds
      .slice(1, 4)
      .map((id) => { const l = getLetterById(id); return l ? getExampleByHarakah(l, harakah).arabic : undefined })
      .filter((w): w is string => !!w)
    if (distractorWords.length >= 2) {
      exercises.push({
        id: `word_listen_${suffix}`,
        type: 'word_listen',
        letterId: letterIds[0],
        promptText: 'Which word did you hear?',
        correctAnswer: correctWord.arabic,
        distractors: distractorWords,
        wordExample: correctWord,
      })
    }
  }

  // ── Phase 6: word_match — see Arabic word + emoji, pick English meaning ──
  const wmIdx = Math.min(1, letterIds.length - 1)
  const wmLetter = getLetterById(letterIds[wmIdx])
  if (wmLetter && wmLetter.examples.length > 0) {
    const correctWord = getExampleByHarakah(wmLetter, harakah)
    const distractorMeanings = letterIds
      .filter((_, i) => i !== wmIdx)
      .slice(0, 3)
      .map((id) => { const l = getLetterById(id); return l ? getExampleByHarakah(l, harakah).meaning : undefined })
      .filter((m): m is string => !!m)
    if (distractorMeanings.length >= 2) {
      exercises.push({
        id: `word_match_${suffix}`,
        type: 'word_match',
        letterId: letterIds[wmIdx],
        promptText: 'What does this word mean?',
        correctAnswer: correctWord.meaning,
        distractors: distractorMeanings,
        wordExample: correctWord,
      })
    }
  }

  // ── Phase 7: sentence_read — only for review lessons (17-19) ─────────────
  if (lessonId !== undefined && lessonId >= 17) {
    const sentences = getSentencesForLesson(lessonId).slice(0, 3)
    for (const sentence of sentences) {
      const allMeanings = getSentencesForLesson(lessonId).map((s) => s.meaning)
      const distractors = allMeanings
        .filter((m) => m !== sentence.meaning)
        .slice(0, 3)
      if (distractors.length >= 2) {
        exercises.push({
          id: `sentence_read_${sentence.id}`,
          type: 'sentence_read',
          letterId: letterIds[0],
          promptText: 'What does this sentence mean?',
          correctAnswer: sentence.meaning,
          distractors,
          sentence,
        })
      }
    }
  }

  return exercises
}

/**
 * Adapt a base exercise list based on per-letter mastery data.
 * - known (accuracy ≥ 0.80, attempts ≥ 3): drop teach, keep speak
 * - weak  (accuracy < 0.60, attempts ≥ 2): lead the lesson + extra listen_pick + speak at end
 * - new / normal: unchanged
 * Call once at lesson start with a snapshot of masteryMap to prevent
 * mid-lesson re-adaptation as attempts accumulate.
 */
export function adaptExercises(
  baseExercises: LessonExercise[],
  masteryMap: Record<string, LetterMastery>,
  lessonLetterIds: string[]
): LessonExercise[] {
  const classify = (id: string): 'known' | 'weak' | 'new' | 'normal' => {
    const m = masteryMap[id]
    if (!m || m.attempts === 0) return 'new'
    if (m.accuracy >= 0.80 && m.attempts >= 3) return 'known'
    if (m.accuracy < 0.60 && m.attempts >= 2) return 'weak'
    return 'normal'
  }

  const weakIds = lessonLetterIds.filter((id) => classify(id) === 'weak')
  const knownIds = lessonLetterIds.filter((id) => classify(id) === 'known')

  if (weakIds.length === 0 && knownIds.length === 0) return baseExercises

  const dragdropExercises = baseExercises.filter((e) => e.type === 'dragdrop')
  const teachExercises = baseExercises.filter((e) => e.type === 'teach')
  const speakExercises = baseExercises.filter((e) => e.type === 'speak')
  const listenPickExercises = baseExercises.filter((e) => e.type === 'listen_pick')
  const matchExercises = baseExercises.filter((e) => e.type === 'match')

  const filteredTeach = teachExercises.filter((e) => !knownIds.includes(e.letterId))

  const teachSpeakPairs: LessonExercise[] = []

  // Weak letters first
  for (const id of weakIds) {
    const t = filteredTeach.find((e) => e.letterId === id)
    const s = speakExercises.find((e) => e.letterId === id)
    if (t) teachSpeakPairs.push(t)
    if (s) teachSpeakPairs.push(s)
  }
  // Then remaining letters
  for (const id of lessonLetterIds) {
    if (weakIds.includes(id)) continue
    const t = filteredTeach.find((e) => e.letterId === id)
    const s = speakExercises.find((e) => e.letterId === id)
    if (t) teachSpeakPairs.push(t)
    if (s) teachSpeakPairs.push(s)
  }

  // Extra practice for weak letters after the main blocks
  const extraExercises: LessonExercise[] = []
  for (const id of weakIds) {
    extraExercises.push({
      id: `listen_pick_${id}_extra`,
      type: 'listen_pick',
      letterId: id,
      correctAnswer: id,
      distractors: getDistractors(id, lessonLetterIds),
      promptText: 'Which letter do you hear?',
    })
    extraExercises.push({
      id: `speak_${id}_extra`,
      type: 'speak',
      letterId: id,
      correctAnswer: id,
      distractors: [],
      promptText: 'Say the letter again!',
    })
  }

  return [
    ...teachSpeakPairs,
    ...listenPickExercises,
    ...matchExercises,
    ...extraExercises,
    ...dragdropExercises,
  ]
}
