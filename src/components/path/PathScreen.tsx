import { motion } from 'framer-motion'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
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

  const firstUnlockedIncomplete = LESSONS.find(
    (l) => isLessonUnlocked(activeId, l.id) && !getLessonProgress(activeId, l.id)
  )

  let positionIndex = 0

  return (
    <div className="pb-24 pt-4">
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
