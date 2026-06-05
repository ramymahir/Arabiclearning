import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { useAdaptiveStore } from '@/store/adaptiveStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { getLetterById } from '@/data/letters'
import { LESSON_UNITS, LESSONS } from '@/data/lessons'
import { UnitDivider } from './UnitDivider'
import { PathNode } from './PathNode'

type Track = 'letters' | 'words' | 'sentences'

const TRACK_INFO: Record<Track, { label: string; emoji: string; desc: string }> = {
  letters: { label: 'Letters', emoji: '🔤', desc: 'Learn the 28 Arabic letters and their sounds' },
  words:   { label: 'Words',   emoji: '📖', desc: 'Read real Arabic words from the textbook' },
  sentences: { label: 'Sentences', emoji: '📜', desc: 'Read full Arabic phrases and sentences' },
}

const POSITIONS = ['center', 'right', 'center', 'left', 'center'] as const

function defaultTrack(placementLevel: number): Track {
  if (placementLevel >= 2) return 'sentences'
  if (placementLevel >= 1) return 'words'
  return 'letters'
}

export function PathScreen() {
  const activeId = useProfileStore((s) => s.activeProfileId)!
  const getLessonProgress = useProgressStore((s) => s.getLessonProgress)
  const isLessonUnlocked = useProgressStore((s) => s.isLessonUnlocked)
  const getWeakLetters = useAdaptiveStore((s) => s.getWeakLetters)
  const getLevel = useOnboardingStore((s) => s.getLevel)

  const placementLevel = getLevel(activeId) ?? 0
  const [activeTrack, setActiveTrack] = useState<Track>(() => defaultTrack(placementLevel))
  const [tipDismissed, setTipDismissed] = useState(false)

  const weakLetterIds = getWeakLetters(activeId, 3)
  const weakLetters = weakLetterIds.map((id) => getLetterById(id)).filter(Boolean)

  const visibleUnits = LESSON_UNITS.filter((u) => u.track === activeTrack)
  const visibleLessons = LESSONS.filter((l) => {
    const unit = LESSON_UNITS.find((u) => u.id === l.unitId)
    return unit?.track === activeTrack
  })
  const firstUnlockedIncomplete = visibleLessons.find(
    (l) => isLessonUnlocked(activeId, l.id) && !getLessonProgress(activeId, l.id)
  )

  let positionIndex = 0

  return (
    <div className="pb-24">
      {/* Level tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 pt-4 pb-3 shadow-sm">
        <div className="flex gap-2 max-w-sm mx-auto">
          {(Object.entries(TRACK_INFO) as [Track, typeof TRACK_INFO[Track]][]).map(([track, info]) => (
            <motion.button
              key={track}
              onClick={() => setActiveTrack(track)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2 rounded-2xl border-2 transition-all
                ${activeTrack === track
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'}
              `}
            >
              <span className="text-xl leading-none">{info.emoji}</span>
              <span className={`text-xs font-bold ${activeTrack === track ? 'text-white' : 'text-gray-600'}`}>
                {info.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="pt-4">
        {/* Noor's Tip card — only on letters track */}
        <AnimatePresence>
          {activeTrack === 'letters' && !tipDismissed && (
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
                      <span className="text-amber-700 text-sm self-center">need a bit more practice!</span>
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

        {/* Track description */}
        <motion.p
          key={activeTrack}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm text-gray-500 mb-4 px-6"
        >
          {TRACK_INFO[activeTrack].desc}
        </motion.p>

        {/* Unit + lesson path */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTrack}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {visibleUnits.map((unit) => {
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
              <div className="font-bold">
                {activeTrack === 'letters' && "You've completed the Letters level!"}
                {activeTrack === 'words' && "You've completed the Words level!"}
                {activeTrack === 'sentences' && "You've mastered Arabic reading! 🎉"}
              </div>
              <div className="text-sm mt-1">
                {activeTrack === 'letters' && "Try the Words level next →"}
                {activeTrack === 'words' && "Ready for Sentences? →"}
                {activeTrack === 'sentences' && "Share your achievement with family!"}
              </div>
              {activeTrack !== 'sentences' && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTrack(activeTrack === 'letters' ? 'words' : 'sentences')}
                  className="mt-4 bg-indigo-600 text-white font-bold px-6 py-3 rounded-2xl shadow-md text-sm"
                >
                  {activeTrack === 'letters' ? 'Go to Words →' : 'Go to Sentences →'}
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
