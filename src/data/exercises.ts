import type { LessonExercise, Harakah } from '@/types'
import { ARABIC_LETTERS, getLetterById } from './letters'
import { SENTENCES, getSentencesForLesson } from './sentences'
import { getExampleByHarakah, splitArabicWord } from '@/utils/arabic'

export type ExerciseMode = 'letters' | 'words' | 'sentences'

export interface LetterMastery { accuracy: number; attempts: number }

/**
 * Deterministic distractor selection seeded by correctId.
 * Returns `count` letter IDs from all 28 letters, excluding lessonLetterIds.
 */
function getDistractors(correctId: string, lessonLetterIds: string[], count = 3): string[] {
  const outsideLesson = ARABIC_LETTERS.filter((l) => !lessonLetterIds.includes(l.id))
  const insideLesson = ARABIC_LETTERS.filter(
    (l) => lessonLetterIds.includes(l.id) && l.id !== correctId
  )

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

  while (result.length < count) {
    const fallback = ARABIC_LETTERS.find(
      (l) => l.id !== correctId && !result.includes(l.id)
    )
    if (fallback) result.push(fallback.id)
    else break
  }

  return result.slice(0, count)
}

export function generateLessonExercises(
  letterIds: string[],
  harakah: Harakah,
  lessonId?: number,
  mode: ExerciseMode = 'letters'
): LessonExercise[] {
  const exercises: LessonExercise[] = []
  const suffix = lessonId !== undefined ? String(lessonId) : 'all'

  // ── Sentences mode: offset-based sentence_read only ───────────────────────
  if (mode === 'sentences') {
    const sentenceOffset = lessonId !== undefined ? Math.max(0, (lessonId - 36) * 5) : 0
    const slice = SENTENCES.slice(sentenceOffset, sentenceOffset + 6)
    const allMeanings = SENTENCES.map((s) => s.meaning)
    for (const sentence of slice) {
      const distractors = allMeanings.filter((m) => m !== sentence.meaning).slice(0, 3)
      if (distractors.length >= 2) {
        exercises.push({
          id: `sentence_read_${sentence.id}`,
          type: 'sentence_read',
          letterId: letterIds[0] ?? 'alef',
          promptText: 'What does this sentence mean?',
          correctAnswer: sentence.meaning,
          distractors,
          sentence,
        })
      }
    }
    return exercises
  }

  // ── Phase 0: harakah_pick — for kasra/damma/sukun lessons (letters only) ──
  if (mode === 'letters' && (harakah === 'kasra' || harakah === 'damma' || harakah === 'sukun')) {
    const allHarakah = ['fatha', 'kasra', 'damma', 'sukun']
    const hpLetters = letterIds.slice(0, 3)
    for (const id of hpLetters) {
      exercises.push({
        id: `harakah_pick_${id}`,
        type: 'harakah_pick',
        letterId: id,
        correctAnswer: harakah,
        distractors: allHarakah.filter((h) => h !== harakah).slice(0, 3),
        promptText: 'Which mark do you hear?',
      })
    }
  }

  // ── Phase 1: teach + speak pairs (letters mode only) ─────────────────────
  if (mode === 'letters') {
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

      exercises.push({
        id: `speak_${id}_${i}`,
        type: 'speak',
        letterId: id,
        correctAnswer: id,
        distractors: [],
        promptText: 'Say the letter!',
      })
    }
  }

  // ── Phase 2: listen_pick / balloon_pop alternating (letters mode only) ───
  if (mode === 'letters') {
    letterIds.forEach((id, i) => {
      const type = i % 2 === 0 ? 'listen_pick' : 'balloon_pop'
      exercises.push({
        id: `${type}_${id}`,
        type,
        letterId: id,
        correctAnswer: id,
        distractors: getDistractors(id, letterIds),
        promptText: 'Which letter do you hear?',
      })
    })
  }

  // ── Phase 3: match (letters mode only) ───────────────────────────────────
  if (mode === 'letters') {
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
  }

  // ── Phase 3.5: pick_letter — fill-in-blank, 2 per lesson (lesson 2+) ─────
  if (letterIds.length >= 2) {
    const plLetters = letterIds.slice(0, 2)
    for (const id of plLetters) {
      const letter = getLetterById(id)
      if (!letter) continue
      const ex = getExampleByHarakah(letter, harakah)
      // Split off the first grapheme cluster (base letter + any harakah)
      const segments = splitArabicWord(ex.arabic)
      if (segments.length < 2) continue
      // Blank = first segment's harakah marks only (no base letter) + rest of word
      const firstSegment = segments[0]
      const harakahMarks = firstSegment.slice(letter.arabic.length)
      const blankedWord = '_' + harakahMarks + ex.arabic.slice(firstSegment.length)
      exercises.push({
        id: `pick_letter_${id}`,
        type: 'pick_letter',
        letterId: id,
        correctAnswer: id,
        distractors: getDistractors(id, letterIds, 3),
        wordExample: ex,
        wordHint: blankedWord,
        promptText: 'Which letter completes the word?',
      })
    }
  }

  // ── Phase 4: memory_flip (4+ letters) or dragdrop fallback (letters only) ─
  if (mode === 'letters') {
    if (letterIds.length >= 4) {
      exercises.push({
        id: `memory_flip_${suffix}`,
        type: 'memory_flip',
        letterId: letterIds[0],
        correctAnswer: letterIds.slice(0, 4).join(','),
        distractors: [],
      })
    } else {
      exercises.push({
        id: `dragdrop_${suffix}`,
        type: 'dragdrop',
        letterId: letterIds[0],
        correctAnswer: letterIds.join(','),
        distractors: [],
      })
    }
  }

  // ── Phase 5: word_listen — up to 4 exercises (one per letter) ────────────
  const wlCount = Math.min(4, letterIds.length)
  for (let i = 0; i < wlCount; i++) {
    const wlLetter = getLetterById(letterIds[i])
    if (!wlLetter || wlLetter.examples.length === 0) continue
    const correctWord = getExampleByHarakah(wlLetter, harakah)
    const distractorWords = letterIds
      .filter((_, idx) => idx !== i)
      .slice(0, 4)
      .map((id) => { const l = getLetterById(id); return l ? getExampleByHarakah(l, harakah).arabic : undefined })
      .filter((w): w is string => !!w && w !== correctWord.arabic)
      .slice(0, 3)
    if (distractorWords.length >= 2) {
      exercises.push({
        id: `word_listen_${suffix}_${i}`,
        type: 'word_listen',
        letterId: letterIds[i],
        promptText: 'Which word did you hear?',
        correctAnswer: correctWord.arabic,
        distractors: distractorWords,
        wordExample: correctWord,
      })
    }
  }

  // ── Phase 6: word_match / word_rain alternating — up to 4 exercises ────────
  const wmCount = Math.min(4, letterIds.length)
  for (let i = 0; i < wmCount; i++) {
    const wmLetter = getLetterById(letterIds[i])
    if (!wmLetter || wmLetter.examples.length === 0) continue
    const correctWord = getExampleByHarakah(wmLetter, harakah)
    const distractorMeanings = letterIds
      .filter((_, idx) => idx !== i)
      .slice(0, 4)
      .map((id) => { const l = getLetterById(id); return l ? getExampleByHarakah(l, harakah).meaning : undefined })
      .filter((m): m is string => !!m && m !== correctWord.meaning)
      .slice(0, 3)
    if (distractorMeanings.length >= 2) {
      const wmType = i % 2 === 0 ? 'word_match' : 'word_rain'
      exercises.push({
        id: `${wmType}_${suffix}_${i}`,
        type: wmType,
        letterId: letterIds[i],
        promptText: 'What does this word mean?',
        correctAnswer: correctWord.meaning,
        distractors: distractorMeanings,
        wordExample: correctWord,
      })
    }
  }

  // ── Phase 7: word_build — spell the word (lesson 4+) ─────────────────────
  if (letterIds.length >= 4) {
    const wbLetter = getLetterById(letterIds[0])
    if (wbLetter && wbLetter.examples.length > 0) {
      const wbWord = getExampleByHarakah(wbLetter, harakah)
      exercises.push({
        id: `word_build_${suffix}`,
        type: 'word_build',
        letterId: letterIds[0],
        correctAnswer: wbWord.arabic,
        distractors: getDistractors(letterIds[0], letterIds, 2).slice(0, 2),
        wordExample: wbWord,
        promptText: 'Spell the word!',
      })
    }
  }

  // ── Phase 8: sentence_read (letters mode, lesson 9+; not words mode) ──────
  if (mode === 'letters' && lessonId !== undefined && lessonId >= 9) {
    const maxSentences = lessonId >= 17 ? 4 : 2
    const sentences = getSentencesForLesson(lessonId).slice(0, maxSentences)
    const allMeanings = getSentencesForLesson(lessonId).map((s) => s.meaning)
    for (const sentence of sentences) {
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

  const dragdropExercises = baseExercises.filter((e) => e.type === 'dragdrop' || e.type === 'memory_flip')
  const teachExercises = baseExercises.filter((e) => e.type === 'teach')
  const speakExercises = baseExercises.filter((e) => e.type === 'speak')
  const listenPickExercises = baseExercises.filter((e) => e.type === 'listen_pick' || e.type === 'balloon_pop')
  const matchExercises = baseExercises.filter((e) => e.type === 'match')

  const filteredTeach = teachExercises.filter((e) => !knownIds.includes(e.letterId))

  const teachSpeakPairs: LessonExercise[] = []

  for (const id of weakIds) {
    const t = filteredTeach.find((e) => e.letterId === id)
    const s = speakExercises.find((e) => e.letterId === id)
    if (t) teachSpeakPairs.push(t)
    if (s) teachSpeakPairs.push(s)
  }
  for (const id of lessonLetterIds) {
    if (weakIds.includes(id)) continue
    const t = filteredTeach.find((e) => e.letterId === id)
    const s = speakExercises.find((e) => e.letterId === id)
    if (t) teachSpeakPairs.push(t)
    if (s) teachSpeakPairs.push(s)
  }

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
