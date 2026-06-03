import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, Harakah } from '@/types'
import { getLettersByIds } from '@/data/letters'
import { Button } from '@/components/ui/Button'
import { useAudio } from '@/hooks/useAudio'
import { applyHarakah } from '@/utils/arabic'
import { shuffle } from '@/utils/shuffle'

interface Props {
  exercise: LessonExercise
  harakah: Harakah
  onCorrect: () => void
  onWrong: () => void
  onContinue: () => void
}

interface DropZone {
  letterId: string
  matched: string | null
  el: HTMLDivElement | null
}

const TILE_GRADIENTS = [
  'from-amber-400 to-orange-500',
  'from-sky-400 to-blue-500',
  'from-violet-400 to-purple-500',
  'from-emerald-400 to-teal-500',
]

export function DragDropMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playSFX } = useAudio()
  const allIds = [exercise.correctAnswer, ...exercise.distractors].slice(0, 4)
  const letters = getLettersByIds(allIds)

  const [shuffledLetters] = useState(() => shuffle(letters))
  const dropZones = useRef<DropZone[]>(
    letters.map((l) => ({ letterId: l.id, matched: null, el: null }))
  )

  const [matched, setMatched] = useState<Record<string, string>>({})
  const [shaking, setShaking] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState(0)

  const checkMatch = (letterId: string, x: number, y: number) => {
    const letter = letters.find((l) => l.id === letterId)
    if (!letter) return

    for (const zone of dropZones.current) {
      const el = zone.el
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        if (zone.letterId === letterId) {
          setMatched((m) => {
            const newM = { ...m, [letterId]: letterId }
            const allMatched = Object.keys(newM).length === letters.length
            if (allMatched) {
              setDone(true)
              if (errors === 0) onCorrect()
              else onWrong()
            }
            return newM
          })
          playSFX('correct')
        } else {
          setShaking(letterId)
          setErrors((e) => e + 1)
          playSFX('wrong')
          setTimeout(() => setShaking(null), 500)
        }
        return
      }
    }
  }

  return (
    <div className="max-w-sm mx-auto flex flex-col px-4 pt-4 pb-20 gap-4">
      <div className="text-center font-bold text-gray-600 text-xl mb-2">
        Match each letter to its word! 🎯
      </div>

      <div className="flex gap-4">
        {/* Letters column */}
        <div className="flex-1">
          <div className="text-xs text-center font-bold text-gray-400 mb-2 uppercase tracking-wide">
            Letters
          </div>
          <div className="flex flex-col gap-3">
            {shuffledLetters.map((letter, i) => {
              const isMatched = !!matched[letter.id]
              const gradient = TILE_GRADIENTS[i % TILE_GRADIENTS.length]
              return (
                <motion.div
                  key={letter.id}
                  drag={!isMatched}
                  dragSnapToOrigin={!isMatched}
                  animate={shaking === letter.id ? { x: [0, -10, 10, -8, 8, 0] } : {}}
                  onDragEnd={(_, info) => {
                    checkMatch(letter.id, info.point.x, info.point.y)
                  }}
                  onClick={() => playLetter(letter)}
                  whileHover={!isMatched ? { scale: 1.05 } : {}}
                  className={`
                    rounded-2xl flex items-center justify-center min-h-[80px]
                    ${isMatched
                      ? 'bg-emerald-100 border-2 border-emerald-400 opacity-60 cursor-default'
                      : `bg-gradient-to-br ${gradient} shadow-lg cursor-grab active:cursor-grabbing`
                    }
                  `}
                  style={{ touchAction: 'none' }}
                >
                  <span
                    className={`text-4xl font-arabic font-bold ${isMatched ? 'text-emerald-600' : 'text-white'}`}
                    dir="rtl"
                  >
                    {applyHarakah(letter.arabic, harakah)}
                  </span>
                  {isMatched && <span className="ml-1 text-emerald-500">✅</span>}
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Drop zones / word targets */}
        <div className="flex-1">
          <div className="text-xs text-center font-bold text-gray-400 mb-2 uppercase tracking-wide">
            Words
          </div>
          <div className="flex flex-col gap-3">
            {letters.map((letter, i) => {
              const zone = dropZones.current[i]
              if (!zone) return null
              return (
                <div
                  key={letter.id}
                  ref={(el) => { dropZones.current[i].el = el }}
                  className={`
                    rounded-2xl border-2 border-dashed flex flex-col items-center min-h-[80px] justify-center
                    p-3 transition-colors
                    ${matched[letter.id]
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-300 bg-gray-50'
                    }
                  `}
                >
                  <span className="text-4xl mb-1">{letter.examples[0].emoji}</span>
                  <span className="text-lg font-arabic text-gray-700" dir="rtl">
                    {letter.examples[0].arabic}
                  </span>
                  <span className="text-xs text-gray-400">{letter.examples[0].meaning}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {done && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2"
        >
          <Button onClick={onContinue} fullWidth className="text-xl py-4">
            Continue →
          </Button>
        </motion.div>
      )}
    </div>
  )
}
