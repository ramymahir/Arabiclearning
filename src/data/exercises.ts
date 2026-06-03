import type { LessonExercise, Harakah } from '@/types'
import { ARABIC_LETTERS, getLetterById } from './letters'
import { getHarakahChar } from '@/utils/arabic'

let exerciseIdCounter = 0
const nextId = () => `ex_${++exerciseIdCounter}`

function getDistractors(correctId: string, allLetterIds: string[], count = 3): string[] {
  const correct = getLetterById(correctId)!
  const candidates = ARABIC_LETTERS.filter(
    (l) => !allLetterIds.includes(l.id) === false || l.id !== correctId
  )
    .filter((l) => l.id !== correctId)
    .sort((a, b) => Math.abs(a.order - correct.order) - Math.abs(b.order - correct.order))

  const pool = allLetterIds
    .filter((id) => id !== correctId)
    .map((id) => getLetterById(id)!)
    .concat(candidates)

  const seen = new Set<string>()
  const result: string[] = []
  for (const l of pool) {
    if (!seen.has(l.id)) {
      seen.add(l.id)
      result.push(l.id)
    }
    if (result.length >= count) break
  }

  while (result.length < count) {
    const fallback = ARABIC_LETTERS.find((l) => l.id !== correctId && !result.includes(l.id))
    if (fallback) result.push(fallback.id)
    else break
  }
  return result.slice(0, count)
}

export function generateLessonExercises(
  letterIds: string[],
  harakah: Harakah
): LessonExercise[] {
  const exercises: LessonExercise[] = []

  // 1. Teach + Speak paired for each letter
  for (const id of letterIds) {
    const letter = getLetterById(id)
    if (!letter) continue
    exercises.push({
      id: nextId(),
      type: 'teach',
      letterId: id,
      correctAnswer: id,
      distractors: [],
    })
    // Speak exercise immediately after each teach — no heart penalty
    exercises.push({
      id: nextId(),
      type: 'speak',
      letterId: id,
      correctAnswer: id,
      distractors: [],
    })
  }

  // 2. Listen & pick for each letter (randomised order)
  const shuffledForListen = [...letterIds].sort(() => Math.random() - 0.5)
  for (const id of shuffledForListen) {
    exercises.push({
      id: nextId(),
      type: 'listen_pick',
      letterId: id,
      correctAnswer: id,
      distractors: getDistractors(id, letterIds),
    })
  }

  // 3. Match round (see letter → pick word)
  const shuffledForMatch = [...letterIds].sort(() => Math.random() - 0.5)
  for (const id of shuffledForMatch) {
    const letter = getLetterById(id)
    if (!letter || letter.examples.length === 0) continue
    const example = letter.examples[0]
    exercises.push({
      id: nextId(),
      type: 'match',
      letterId: id,
      correctAnswer: id,
      distractors: getDistractors(id, letterIds),
      wordExample: example,
    })
  }

  // 4. DragDrop round if lesson has 3+ letters
  if (letterIds.length >= 3) {
    const sample = letterIds.slice(0, Math.min(4, letterIds.length))
    exercises.push({
      id: nextId(),
      type: 'dragdrop',
      letterId: sample[0],
      correctAnswer: sample.join(','),
      distractors: sample.slice(1),
    })
  }

  return exercises
}
