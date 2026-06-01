import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import type { LessonExercise, Harakah } from '@/types'
import { getLettersByIds } from '@/data/letters'
import { ArabicText } from '@/components/ui/ArabicText'
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

export function DragDropMode({ exercise, harakah, onCorrect, onWrong, onContinue }: Props) {
  const { playLetter, playSFX } = useAudio()
  const allIds = [exercise.correctAnswer, ...exercise.distractors].slice(0, 4)
  const letters = getLettersByIds(allIds)

  const shuffledLetters = shuffle(letters)
  const dropZones = useRef<DropZone[]>(
    letters.map((l) => ({ letterId: l.id, matched: null, el: null }))
  )

  const [matched, setMatched] = useState<Record<string, string>>({})
  const [shaking, setShaking] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState(0)
  const wordRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const checkMatch = (letterId: string, x: number, y: number) => {
    const letter = letters.find((l) => l.id === letterId)
    if (!letter) return

    // Find which word target we're over
    for (const zone of dropZones.current) {
      const el = zone.el
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        if (zone.letterId === letterId) {
          // Correct match!
          setMatched((m) => ({ ...m, [letterId]: letterId }))
          playSFX('correct')
          const allMatched = Object.keys(matched).length + 1 === letters.length
          if (allMatched) {
            setDone(true)
            if (errors === 0) onCorrect()
            else onWrong()
          }
        } else {
          // Wrong drop
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
    <div className="flex flex-col px-4 pt-4 pb-20">
      <div className="text-center font-bold text-gray-600 text-lg mb-6">
        Match each letter to its word! 🎯
      </div>

      {/* Words column (drop targets) */}
      <div className="flex gap-4 mb-8">
        <div className="flex-1">
          <div className="text-xs text-center font-bold text-gray-400 mb-2">LETTERS</div>
          <div className="flex flex-col gap-3">
            {shuffledLetters.map((letter) => {
              const isMatched = !!matched[letter.id]
              return (
                <motion.div
                  key={letter.id}
                  drag={!isMatched}
                  dragSnapToOrigin={!isMatched}
                  animate={shaking === letter.id ? { x: [0, -8, 8, -6, 6, 0] } : {}}
                  onDragEnd={(_, info) => {
                    checkMatch(letter.id, info.point.x, info.point.y)
                  }}
                  onClick={() => playLetter(letter)}
                  className={`
                    rounded-2xl border-2 p-4 flex items-center justify-center cursor-grab
                    ${isMatched ? 'border-correct bg-correct/10 cursor-default opacity-60' : 'border-primary bg-white shadow-sm'}
                  `}
                  style={{ touchAction: 'none' }}
                >
                  <ArabicText size="4xl">
                    {applyHarakah(letter.arabic, harakah)}
                  </ArabicText>
                  {isMatched && <span className="ml-2">✅</span>}
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="flex-1">
          <div className="text-xs text-center font-bold text-gray-400 mb-2">WORDS</div>
          <div className="flex flex-col gap-3">
            {letters.map((letter, i) => {
              const zone = dropZones.current[i]
              if (!zone) return null
              return (
                <div
                  key={letter.id}
                  ref={(el) => { dropZones.current[i].el = el }}
                  className={`
                    rounded-2xl border-2 border-dashed p-3 flex flex-col items-center min-h-[80px] justify-center transition-colors
                    ${matched[letter.id] ? 'border-correct bg-correct/10' : 'border-gray-300 bg-gray-50'}
                  `}
                >
                  <span className="text-3xl">{letter.examples[0].emoji}</span>
                  <ArabicText size="base" className="text-gray-700">{letter.examples[0].arabic}</ArabicText>
                  <span className="text-xs text-gray-400">{letter.examples[0].meaning}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {done && (
        <Button onClick={onContinue} fullWidth className="text-xl py-4">
          Continue →
        </Button>
      )}
    </div>
  )
}
