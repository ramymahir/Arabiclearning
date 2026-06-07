import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LessonExercise, Harakah } from '@/types'
import { getLetterById } from '@/data/letters'
import { useAudio } from '@/hooks/useAudio'
import { getExampleByHarakah, applyHarakah } from '@/utils/arabic'

interface Props {
  exercise: LessonExercise
  harakah: Harakah
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

interface MemCard {
  id: string        // unique card id
  pairKey: string   // letterId — the pair key shared between letter card and word card
  kind: 'letter' | 'word'
}

const PAIR_COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-violet-600',
  'bg-sky-500',
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function MemoryFlipMode({ exercise, harakah, onCorrect, onContinue }: Props) {
  const { playSFX, playLetter } = useAudio()

  // Build 8 cards: 4 letter + 4 word
  const pairLetterIds = exercise.correctAnswer.split(',').slice(0, 4)

  const [cards] = useState<MemCard[]>(() =>
    shuffle([
      ...pairLetterIds.map((id) => ({ id: `letter_${id}`, pairKey: id, kind: 'letter' as const })),
      ...pairLetterIds.map((id) => ({ id: `word_${id}`,   pairKey: id, kind: 'word'   as const })),
    ])
  )

  const [flipped, setFlipped] = useState<string[]>([])    // card ids currently face-up
  const [matched, setMatched] = useState<string[]>([])    // pairKeys that are matched
  const [locked,  setLocked]  = useState(false)           // block taps while checking pair
  const [errors,  setErrors]  = useState(0)
  const [done,    setDone]    = useState(false)

  useEffect(() => {
    if (matched.length === pairLetterIds.length && !done) {
      setDone(true)
      playSFX('correct')
      // Small delay before reporting complete
      setTimeout(() => onCorrect(), 600)
    }
  }, [matched])

  const handleFlip = (card: MemCard) => {
    if (locked) return
    if (flipped.includes(card.id)) return
    if (matched.includes(card.pairKey)) return

    const newFlipped = [...flipped, card.id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setLocked(true)
      const [a, b] = newFlipped.map((cid) => cards.find((c) => c.id === cid)!)

      if (a.pairKey === b.pairKey) {
        // Match!
        playSFX('correct')
        const letter = getLetterById(a.pairKey)
        if (letter) playLetter(letter, applyHarakah(letter.arabic, harakah))
        setTimeout(() => {
          setMatched((prev) => [...prev, a.pairKey])
          setFlipped([])
          setLocked(false)
        }, 500)
      } else {
        // Mismatch
        playSFX('wrong')
        setErrors((e) => e + 1)
        setTimeout(() => {
          setFlipped([])
          setLocked(false)
        }, 900)
      }
    }
  }

  const pairColorMap = Object.fromEntries(
    pairLetterIds.map((id, i) => [id, PAIR_COLORS[i % PAIR_COLORS.length]])
  )

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 pt-4 pb-36 gap-4">
      <p className="text-center font-bold text-gray-700 text-xl">Match letters to their words! 🃏</p>
      <p className="text-sm text-gray-500">Flip two cards — find the pair</p>

      {/* 4×2 card grid */}
      <div className="grid grid-cols-4 gap-2 w-full">
        {cards.map((card) => {
          const isFaceUp = flipped.includes(card.id) || matched.includes(card.pairKey)
          const isMatched = matched.includes(card.pairKey)
          const letter = getLetterById(card.pairKey)!
          const word = getExampleByHarakah(letter, harakah)
          const pairColor = pairColorMap[card.pairKey]

          return (
            <div key={card.id} style={{ perspective: 800 }} className="aspect-[3/4]">
              <motion.div
                onClick={() => handleFlip(card)}
                className="relative w-full h-full cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFaceUp ? 180 : 0 }}
                transition={{ duration: 0.35 }}
              >
                {/* Back face */}
                <div
                  className="absolute inset-0 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <motion.span
                    className="text-2xl"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    ✨
                  </motion.span>
                </div>

                {/* Front face */}
                <div
                  className={`absolute inset-0 rounded-2xl flex flex-col items-center justify-center p-1 shadow-md
                    ${isMatched ? 'ring-2 ring-white ring-offset-1' : ''}
                    ${pairColor}
                  `}
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  {card.kind === 'letter' ? (
                    <span className="font-arabic text-3xl font-black text-white leading-none" dir="rtl">
                      {applyHarakah(letter.arabic, harakah)}
                    </span>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="text-2xl leading-none">{word.emoji}</span>
                      <span className="font-arabic text-sm text-white font-bold text-center leading-tight" dir="rtl">
                        {word.arabic}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )
        })}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {pairLetterIds.map((id) => (
          <motion.div
            key={id}
            className={`w-4 h-4 rounded-full transition-colors ${matched.includes(id) ? pairColorMap[id] : 'bg-gray-200'}`}
            animate={matched.includes(id) ? { scale: [1, 1.4, 1] } : {}}
            transition={{ duration: 0.3 }}
          />
        ))}
      </div>

      {errors > 0 && !done && (
        <p className="text-sm text-gray-400">Tries: {errors + matched.length * 2} — keep going! 💪</p>
      )}

      {/* Completion banner */}
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-emerald-500 rounded-3xl p-5 text-center shadow-xl"
          >
            <div className="text-4xl mb-1">🎉</div>
            <p className="text-white font-black text-xl">All matched!</p>
            <motion.button
              onClick={onContinue}
              className="mt-3 bg-white text-emerald-700 font-black px-8 py-3 rounded-2xl shadow-md"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
            >
              Continue →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
