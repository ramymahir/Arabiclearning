import type { LessonExercise, Harakah } from '@/types'
import { ARABIC_LETTERS, getLetterById } from './letters'

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
      wordExample: letter.examples[0],
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

  return exercises
}
