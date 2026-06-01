import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ArabicLetter, Harakah } from '@/types'
import { ArabicText } from '@/components/ui/ArabicText'
import { Button } from '@/components/ui/Button'
import { useAudio } from '@/hooks/useAudio'
import { applyHarakah, HARAKAH_DESCRIPTIONS } from '@/utils/arabic'
import { letterBounceIn } from '@/hooks/useAnimation'

interface Props {
  letter: ArabicLetter
  harakah: Harakah
  onContinue: () => void
}

export function TeachMode({ letter, harakah, onContinue }: Props) {
  const { playLetter, playWord } = useAudio()
  const [wordIndex, setWordIndex] = useState(0)
  const harakahInfo = HARAKAH_DESCRIPTIONS[harakah]
  const displayArabic = applyHarakah(letter.arabic, harakah)

  useEffect(() => {
    const t = setTimeout(() => playLetter(letter), 400)
    return () => clearTimeout(t)
  }, [letter.id])

  return (
    <div className="flex flex-col items-center px-4 pb-32">
      {/* Header */}
      <div className="w-full text-center mb-6 mt-4">
        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1 text-sm font-semibold text-primary">
          📖 New Letter
        </div>
      </div>

      {/* Letter card */}
      <motion.div
        {...letterBounceIn}
        className="relative w-52 h-52 rounded-3xl bg-white border-4 border-primary shadow-xl flex flex-col items-center justify-center mb-6 cursor-pointer"
        onClick={() => playLetter(letter)}
      >
        {/* Decorative sparkles */}
        <motion.span
          className="absolute top-4 right-4 text-2xl"
          animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >✨</motion.span>
        <motion.span
          className="absolute bottom-4 left-4 text-xl"
          animate={{ rotate: [0, -20, 20, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
        >⭐</motion.span>

        <ArabicText size="8xl" className="text-gray-800 leading-none">
          {displayArabic}
        </ArabicText>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-primary font-bold text-lg">🔊</span>
          <span className="text-gray-600 text-base font-semibold">/{letter.transliteration}/</span>
        </div>
      </motion.div>

      {/* Harakah info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-6"
      >
        <span className="text-sm font-semibold text-gray-500">{harakahInfo.en}</span>
        <span className="text-2xl mx-2">·</span>
        <ArabicText size="lg" className="text-gray-700">{harakahInfo.ar}</ArabicText>
        <div className="mt-1 text-gray-500 text-sm">{letter.phonemeDescription}</div>
      </motion.div>

      {/* Tap to hear again */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={() => playLetter(letter)}
        className="flex items-center gap-2 bg-sky/10 text-sky border-2 border-sky rounded-2xl px-5 py-2 font-semibold mb-8"
      >
        🔊 Tap to hear
      </motion.button>

      {/* Example words */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full"
      >
        <div className="text-center font-bold text-gray-600 mb-3">Example words:</div>
        <div className="grid grid-cols-3 gap-3">
          {letter.examples.map((ex, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              onClick={() => {
                setWordIndex(i)
                playWord(ex)
              }}
              className={`
                rounded-2xl p-3 flex flex-col items-center gap-1 border-2 transition-all
                ${wordIndex === i ? 'border-sky bg-sky/10' : 'border-border bg-white hover:border-gray-300'}
              `}
            >
              <span className="text-4xl">{ex.emoji}</span>
              <ArabicText size="lg" className="text-gray-800">{ex.arabic}</ArabicText>
              <span className="text-xs text-gray-500">{ex.meaning}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Forms display */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0 }}
        className="w-full mt-6 bg-white rounded-2xl border-2 border-border p-4"
      >
        <div className="text-sm font-bold text-gray-500 mb-3 text-center">Letter Forms</div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {(['isolated', 'beginning', 'middle', 'end'] as const).map((form) => (
            <div key={form} className="flex flex-col items-center gap-1">
              <ArabicText size="2xl" className="text-gray-800">{letter.forms[form]}</ArabicText>
              <span className="text-xs text-gray-400 capitalize">{form}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Continue button */}
      <div className="fixed bottom-6 left-0 right-0 px-4">
        <div className="max-w-md mx-auto">
          <Button onClick={onContinue} fullWidth className="text-xl py-4">
            Continue →
          </Button>
        </div>
      </div>
    </div>
  )
}
