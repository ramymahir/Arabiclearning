import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { LessonExercise, AnswerResult, Harakah } from '@/types'
import { ARABIC_LETTERS, getLetterById } from '@/data/letters'
import { splitArabicWord } from '@/utils/arabic'
import { useAudio } from '@/hooks/useAudio'
import { AnswerFeedback } from './AnswerFeedback'
import { shuffle } from '@/utils/shuffle'

interface Props {
  exercise: LessonExercise
  harakah: Harakah
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

interface Tile {
  id: string      // unique tile id (letterId + index)
  letterId: string
  arabic: string  // isolated form
  used: boolean
}

export function WordBuildMode({ exercise, onCorrect, onWrong, onContinue }: Props) {
  const { playWord, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [filledSlots, setFilledSlots] = useState<string[]>([])   // arabic chars placed so far
  const [wrongTileId, setWrongTileId] = useState<string | null>(null)

  const word = exercise.wordExample!
  const segments = useMemo(() => splitArabicWord(word.arabic), [word.arabic])

  // Build expected sequence of base letter Arabic chars
  const expectedBaseChars = useMemo(
    () => segments.map((seg) => seg[0]),
    [segments]
  )

  // Build tile bank: letters from the word + distractor letterIds
  const [tiles] = useState<Tile[]>(() => {
    const wordTiles: Tile[] = segments.map((seg, i) => {
      const baseChar = seg[0]
      const matchedLetter = ARABIC_LETTERS.find((l) => l.arabic === baseChar)
      const id = matchedLetter?.id ?? baseChar
      return { id: `word_${i}`, letterId: id, arabic: baseChar, used: false }
    })

    const distractorTiles: Tile[] = exercise.distractors.slice(0, 2).map((ltId, i) => {
      const l = getLetterById(ltId)
      return { id: `dist_${i}`, letterId: ltId, arabic: l?.arabic ?? ltId, used: false }
    })

    return shuffle([...wordTiles, ...distractorTiles])
  })

  const [tileStates, setTileStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(tiles.map((t) => [t.id, false]))
  )

  useEffect(() => {
    const t = setTimeout(() => playWord(word), 400)
    return () => clearTimeout(t)
  }, [exercise.id])

  const nextSlotIndex = filledSlots.length

  const handleTileTap = (tile: Tile) => {
    if (tileStates[tile.id]) return   // already used
    if (result !== 'pending') return

    const expected = expectedBaseChars[nextSlotIndex]
    if (tile.arabic === expected) {
      const newFilled = [...filledSlots, tile.arabic + segments[nextSlotIndex].slice(1)]
      setTileStates((prev) => ({ ...prev, [tile.id]: true }))
      setFilledSlots(newFilled)

      if (newFilled.length === segments.length) {
        setResult('correct')
        playSFX('correct')
        onCorrect()
      }
    } else {
      setWrongTileId(tile.id)
      playSFX('wrong')
      onWrong()
      setTimeout(() => setWrongTileId(null), 600)
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 pt-4 pb-36 gap-6">
      <div className="text-center font-bold text-gray-600 text-xl">
        Spell the word!
      </div>

      {/* Emoji + audio hint */}
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => playWord(word)}
        className="flex flex-col items-center gap-2 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-3xl px-10 py-5 shadow-xl"
      >
        <span className="text-6xl">{word.emoji}</span>
        <span className="text-white/80 text-sm">🔊 Tap to hear</span>
      </motion.button>

      {/* Word slots (right-to-left) */}
      <div className="flex flex-row-reverse gap-2 w-full justify-center flex-wrap" dir="rtl">
        {segments.map((seg, i) => {
          const filled = filledSlots[i]
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`
                w-14 h-14 rounded-2xl border-2 flex items-center justify-center
                ${filled
                  ? 'bg-emerald-100 border-emerald-400'
                  : i === nextSlotIndex
                    ? 'bg-blue-50 border-blue-400 border-dashed animate-pulse'
                    : 'bg-gray-100 border-gray-300 border-dashed'
                }
              `}
            >
              {filled ? (
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  className="text-3xl font-arabic text-emerald-700"
                  dir="rtl"
                >
                  {filled}
                </motion.span>
              ) : (
                <span className="text-gray-400 text-lg">◌</span>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Tile bank */}
      <div className="flex flex-wrap justify-center gap-3 w-full">
        {tiles.map((tile) => {
          const used = tileStates[tile.id]
          const isWrong = wrongTileId === tile.id

          return (
            <motion.button
              key={tile.id}
              animate={isWrong ? { x: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 0.35 }}
              whileHover={!used && result === 'pending' ? { scale: 1.08 } : {}}
              whileTap={!used && result === 'pending' ? { scale: 0.92 } : {}}
              onClick={() => handleTileTap(tile)}
              disabled={used || result !== 'pending'}
              className={`
                w-16 h-16 rounded-2xl border-2 shadow-md flex items-center justify-center
                font-arabic text-3xl transition-all
                ${used
                  ? 'bg-gray-100 border-gray-200 text-gray-300 opacity-40'
                  : isWrong
                    ? 'bg-rose-200 border-rose-400 text-rose-700'
                    : 'bg-white border-indigo-300 text-indigo-800 hover:border-indigo-500'
                }
              `}
              dir="rtl"
            >
              {tile.arabic}
            </motion.button>
          )
        })}
      </div>

      {result === 'correct' && (
        <AnimatePresence>
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <div className="text-4xl mb-1">🎉</div>
            <div className="font-arabic text-3xl text-emerald-700" dir="rtl">{word.arabic}</div>
            <div className="text-gray-600 font-medium mt-1">{word.meaning}</div>
          </motion.div>
        </AnimatePresence>
      )}

      <AnswerFeedback
        result={result}
        correctText={`${word.arabic} — ${word.meaning}`}
        onContinue={onContinue}
      />
    </div>
  )
}
