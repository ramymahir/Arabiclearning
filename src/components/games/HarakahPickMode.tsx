import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, AnswerResult, Harakah } from '@/types'
import { getLetterById } from '@/data/letters'
import { applyHarakah, getHarakahChar, HARAKAH_DESCRIPTIONS } from '@/utils/arabic'
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

const TILE_COLORS = [
  { base: 'bg-amber-100 border-amber-300 text-amber-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-sky-100 border-sky-300 text-sky-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-violet-100 border-violet-300 text-violet-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
  { base: 'bg-emerald-100 border-emerald-300 text-emerald-900', correct: 'bg-emerald-400 border-emerald-500 text-white', wrong: 'bg-rose-400 border-rose-500 text-white' },
]

export function HarakahPickMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playSFX } = useAudio()
  const [result, setResult] = useState<AnswerResult>('pending')
  const [selected, setSelected] = useState<string | null>(null)
  const [played, setPlayed] = useState(false)

  const letter = getLetterById(exercise.letterId)!
  const vowelledSound = applyHarakah(letter.arabic, harakah)

  const [options] = useState(() =>
    shuffle([exercise.correctAnswer, ...exercise.distractors.slice(0, 3)]) as Harakah[]
  )

  const playSound = () => {
    playLetter(letter, vowelledSound)
    setPlayed(true)
  }

  useEffect(() => {
    const t = setTimeout(playSound, 400)
    return () => clearTimeout(t)
  }, [exercise.id])

  const handleSelect = (h: Harakah) => {
    if (result !== 'pending') return
    setSelected(h)
    if (h === exercise.correctAnswer) {
      setResult('correct')
      playSFX('correct')
      onCorrect()
    } else {
      setResult('wrong')
      playSFX('wrong')
      onWrong()
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col items-center px-4 pt-4 pb-36 gap-6">
      <div className="text-center font-bold text-gray-600 text-xl">
        Which mark do you hear?
      </div>

      {/* Letter + speaker */}
      <div className="flex flex-col items-center gap-3">
        <motion.button
          onClick={playSound}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.93 }}
          className="w-[120px] h-[120px] rounded-3xl bg-gradient-to-br from-indigo-400 to-purple-600 flex flex-col items-center justify-center shadow-xl shadow-indigo-300/40"
        >
          <span className="text-6xl font-arabic leading-none" dir="rtl">
            {letter.arabic}
          </span>
          <span className="text-2xl mt-1">🔊</span>
        </motion.button>
        {played && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-gray-500 font-medium"
          >
            Tap to hear again
          </motion.p>
        )}
      </div>

      {/* Harakah option tiles */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {options.map((h, idx) => {
          const info = HARAKAH_DESCRIPTIONS[h]
          const mark = getHarakahChar(h)
          const theme = TILE_COLORS[idx % TILE_COLORS.length]
          const isSelected = selected === h
          const isCorrect = h === exercise.correctAnswer
          const showCorrect = isSelected && result === 'correct'
          const showWrong = isSelected && result === 'wrong'
          const revealCorrect = !isSelected && isCorrect && result === 'wrong'

          let colorClass = theme.base
          if (showCorrect || revealCorrect) colorClass = theme.correct
          if (showWrong) colorClass = theme.wrong
          if (!isSelected && result !== 'pending' && !revealCorrect) colorClass = `${theme.base} opacity-60`

          return (
            <motion.button
              key={h}
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                scale: showCorrect ? [1, 1.12, 1] : 1,
                x: showWrong ? [0, -8, 8, -6, 6, 0] : 0,
              }}
              transition={{ delay: idx * 0.08 }}
              whileHover={result === 'pending' ? { scale: 1.05 } : {}}
              whileTap={result === 'pending' ? { scale: 0.95 } : {}}
              onClick={() => handleSelect(h)}
              disabled={result !== 'pending'}
              className={`rounded-2xl p-4 flex flex-col items-center justify-center min-h-[90px] border-2 shadow-lg transition-all ${colorClass}`}
            >
              {/* Harakah mark on a neutral base letter */}
              <span className="text-3xl font-arabic leading-none mb-1" dir="rtl">
                {'نـ' + mark}
              </span>
              <span className="text-xs font-bold uppercase tracking-wide">{info?.en}</span>
              <span className="text-xs opacity-80">"{info?.sound}"</span>
            </motion.button>
          )
        })}
      </div>

      <AnswerFeedback
        result={result}
        correctText={`${HARAKAH_DESCRIPTIONS[exercise.correctAnswer as Harakah]?.en} — "${HARAKAH_DESCRIPTIONS[exercise.correctAnswer as Harakah]?.sound}"`}
        onContinue={onContinue}
      />
    </div>
  )
}
