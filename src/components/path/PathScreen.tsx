import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { useAdaptiveStore } from '@/store/adaptiveStore'
import { getLetterById } from '@/data/letters'
import { LESSON_UNITS, LESSONS } from '@/data/lessons'
import { UnitDivider } from './UnitDivider'
import { PathNode } from './PathNode'

const POSITIONS = ['center', 'right', 'center', 'left', 'center'] as const

export function PathScreen() {
  const activeId = useProfileStore((s) => s.activeProfileId)!
  const getProgress = useProgressStore((s) => s.getProgress)
  const getLessonProgress = useProgressStore((s) => s.getLessonProgress)
  const isLessonUnlocked = useProgressStore((s) => s.isLessonUnlocked)
  const progress = getProgress(activeId)
  const getWeakLetters = useAdaptiveStore((s) => s.getWeakLetters)
  const weakLetterIds = getWeakLetters(activeId, 3)
  const weakLetters = weakLetterIds.map((id) => getLetterById(id)).filter(Boolean)
  const [tipDismissed, setTipDismissed] = useState(false)

  const firstUnlockedIncomplete = LESSONS.find(
    (l) => isLessonUnlocked(activeId, l.id) && !getLessonProgress(activeId, l.id)
  )

  let positionIndex = 0

  return (
    <div className="pb-24 pt-4">
      {/* Noor's Tip card — dismissible, shows weak letters */}
      <AnimatePresence>
        {!tipDismissed && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="mx-4 mb-4 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-amber-800 font-bold text-sm mb-1">✨ Noor's Tip</p>
                {weakLetters.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {weakLetters.map((l) => (
                      <span
                        key={l!.id}
                        className="bg-amber-100 text-amber-900 font-arabic text-2xl px-3 py-1 rounded-xl"
                        dir="rtl"
                      >
                        {l!.arabic}
                      </span>
                    ))}
                    <span className="text-amber-700 text-sm self-center">
                      need a bit more practice!
                    </span>
                  </div>
                ) : (
                  <p className="text-amber-700 text-sm">You're doing great! 🌟 Keep it up!</p>
                )}
              </div>
              <button
                onClick={() => setTipDismissed(true)}
                className="text-amber-400 hover:text-amber-600 text-xl leading-none mt-0.5"
                aria-label="Dismiss tip"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {LESSON_UNITS.map((unit) => {
        const unitLessons = LESSONS.filter((l) => l.unitId === unit.id)
        return (
          <div key={unit.id}>
            <UnitDivider unit={unit} />
            <div className="flex flex-col gap-6 py-4 px-2">
              {unitLessons.map((lesson) => {
                const pos = POSITIONS[positionIndex % POSITIONS.length]
                positionIndex++
                const lp = getLessonProgress(activeId, lesson.id)
                const unlocked = isLessonUnlocked(activeId, lesson.id)
                const isCurrent = firstUnlockedIncomplete?.id === lesson.id

                return (
                  <motion.div
                    key={lesson.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.3 }}
                    className="flex"
                    style={{
                      justifyContent:
                        pos === 'left' ? 'flex-start' : pos === 'right' ? 'flex-end' : 'center',
                    }}
                  >
                    <PathNode
                      lesson={lesson}
                      progress={lp}
                      unlocked={unlocked}
                      isCurrent={isCurrent}
                      position={pos}
                    />
                  </motion.div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">🏆</div>
        <div className="font-bold">You've reached the end!</div>
        <div className="text-sm">Complete all lessons to master Arabic reading</div>
      </div>
    </div>
  )
}
