import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { ArabicLetter, Harakah } from '@/types'
import { useAudio } from '@/hooks/useAudio'
import { applyHarakah, HARAKAH_DESCRIPTIONS } from '@/utils/arabic'

interface Props {
  letter: ArabicLetter
  harakah: Harakah
  onContinue: () => void
}

const FORM_LABELS = {
  isolated: 'Alone',
  beginning: 'Start',
  middle: 'Middle',
  end: 'End',
} as const

export function TeachMode({ letter, harakah, onContinue }: Props) {
  const { playLetter, playWord } = useAudio()
  const [wordIndex, setWordIndex] = useState<number | null>(null)
  const harakahInfo = HARAKAH_DESCRIPTIONS[harakah]
  const displayArabic = applyHarakah(letter.arabic, harakah)

  useEffect(() => {
    const t = setTimeout(() => playLetter(letter), 400)
    return () => clearTimeout(t)
  }, [letter.id])

  return (
    <div className="max-w-sm mx-auto py-4 px-4 flex flex-col gap-5 pb-32">

      {/* ── Letter Hero Card ── */}
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="rounded-3xl bg-gradient-to-br from-violet-400 to-purple-600 p-8 text-center shadow-xl"
      >
        {/* Big letter */}
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="text-9xl font-arabic text-white leading-none mb-2"
          dir="rtl"
        >
          {displayArabic}
        </motion.div>

        {/* Transliteration */}
        <div className="text-2xl text-white/80 font-semibold mb-1">
          ( {harakahInfo.sound} )
        </div>

        {/* Phoneme description */}
        <div className="text-lg text-white/70 italic mb-5">
          {letter.phonemeDescription}
        </div>

        {/* Play sound button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => playLetter(letter)}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-2xl px-6 py-3 text-xl shadow-lg"
        >
          🔊 Hear it!
        </motion.button>
      </motion.div>

      {/* ── Letter Forms 2×2 Grid ── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl shadow-xl p-5"
      >
        <div className="text-center text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
          Letter Forms
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(['isolated', 'beginning', 'middle', 'end'] as const).map((form) => (
            <motion.button
              key={form}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => playLetter(letter)}
              className="bg-gray-50 rounded-2xl shadow-md p-3 flex flex-col items-center gap-1 border border-gray-100"
            >
              <span className="text-xs font-semibold text-gray-400 uppercase">
                {FORM_LABELS[form]}
              </span>
              <span className="text-4xl font-arabic text-gray-800" dir="rtl">
                {letter.forms[form]}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Word Examples (horizontal scroll) ── */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-center text-sm font-bold text-gray-400 uppercase tracking-wide mb-3">
          Example Words
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
          {letter.examples.map((ex, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setWordIndex(i)
                playWord(ex)
              }}
              className={`
                flex-shrink-0 min-w-[140px] bg-white rounded-3xl shadow-lg p-4 text-center border-2 transition-all
                ${wordIndex === i ? 'border-violet-400 bg-violet-50' : 'border-transparent'}
              `}
            >
              <div className="text-6xl mb-2">{ex.emoji}</div>
              <div className="text-2xl font-arabic text-gray-800 mb-1" dir="rtl">
                {ex.arabic}
              </div>
              <div className="text-sm text-gray-500">{ex.meaning}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Continue button (fixed bottom) ── */}
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <div className="max-w-sm mx-auto">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={onContinue}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-2xl p-5 text-2xl shadow-xl"
          >
            I&apos;ve got it! 🎉
          </motion.button>
        </div>
      </div>
    </div>
  )
}
