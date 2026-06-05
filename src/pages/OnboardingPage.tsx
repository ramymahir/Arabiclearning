import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { ARABIC_LETTERS } from '@/data/letters'
import { audioManager } from '@/audio/audioManager'

const TEST_LETTER_IDS = ['alef', 'seen', 'ain', 'meem', 'ya']

// Vivid saturated colors — no light shades
const OPTION_COLORS = [
  { base: 'bg-rose-500 shadow-rose-600/50',     correct: 'bg-emerald-500 shadow-emerald-600/50', wrong: 'bg-gray-600 shadow-gray-700/50' },
  { base: 'bg-amber-500 shadow-amber-600/50',   correct: 'bg-emerald-500 shadow-emerald-600/50', wrong: 'bg-gray-600 shadow-gray-700/50' },
  { base: 'bg-violet-600 shadow-violet-700/50', correct: 'bg-emerald-500 shadow-emerald-600/50', wrong: 'bg-gray-600 shadow-gray-700/50' },
  { base: 'bg-sky-500 shadow-sky-600/50',       correct: 'bg-emerald-500 shadow-emerald-600/50', wrong: 'bg-gray-600 shadow-gray-700/50' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Question {
  correctId: string
  options: string[]
}

function buildQuestions(): Question[] {
  return TEST_LETTER_IDS.map((correctId) => {
    const distractors = ARABIC_LETTERS.filter((l) => l.id !== correctId)
    const picked = shuffle(distractors).slice(0, 3).map((l) => l.id)
    const options = shuffle([correctId, ...picked])
    return { correctId, options }
  })
}

// Floating decoration bubbles for the background
function FloatingDeco() {
  const items = [
    { emoji: '⭐', top: '8%',  left: '6%',  size: 'text-4xl', delay: 0,   dur: 3.8 },
    { emoji: '🌙', top: '14%', right: '8%', size: 'text-3xl', delay: 0.6, dur: 4.2 },
    { emoji: '✨', top: '40%', left: '4%',  size: 'text-3xl', delay: 1.2, dur: 3.5 },
    { emoji: '🌟', top: '60%', right: '5%', size: 'text-4xl', delay: 1.8, dur: 4.8 },
    { emoji: '💫', top: '80%', left: '10%', size: 'text-3xl', delay: 0.4, dur: 3.2 },
    { emoji: '🎈', top: '25%', right: '12%',size: 'text-3xl', delay: 2.0, dur: 5.0 },
  ]

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Soft glow blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full bg-pink-500/15 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-amber-400/10 translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 rounded-full bg-violet-400/10 -translate-x-1/2 -translate-y-1/2" />
      {/* Floating emojis */}
      {items.map((item, i) => (
        <motion.div
          key={i}
          className={`absolute ${item.size} opacity-30 select-none`}
          style={{ top: item.top, left: 'left' in item ? item.left : undefined, right: 'right' in item ? item.right : undefined }}
          animate={{ y: [0, -18, 0] }}
          transition={{ repeat: Infinity, duration: item.dur, delay: item.delay, ease: 'easeInOut' }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  )
}

// Step 0 — Welcome
function WelcomeStep({ name, onStart }: { name: string; onStart: () => void }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center px-4">
      <FloatingDeco />
      <motion.div
        className="w-full max-w-sm mx-auto text-center relative z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="text-9xl mb-6"
          animate={{ y: [0, -16, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          🌟
        </motion.div>
        <h1 className="text-4xl font-black text-white mb-3">
          Hi {name}! I'm Noor! 👋
        </h1>
        <p className="text-xl text-purple-200 font-semibold mb-10">
          I'll teach you to read Arabic!
        </p>
        <motion.button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-2xl p-5 rounded-3xl shadow-xl shadow-amber-500/40"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Let's Start! 🚀
        </motion.button>
      </motion.div>
    </div>
  )
}

// Step 1 — Placement Test
function PlacementStep({ questions, onDone }: { questions: Question[]; onDone: (score: number) => void }) {
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const question = questions[current]
  const correctLetter = ARABIC_LETTERS.find((l) => l.id === question.correctId)!

  useEffect(() => {
    audioManager.init()
    setTimeout(() => {
      audioManager.playLetter(correctLetter.audioFile, correctLetter.ttsFallback)
    }, 300)
  }, [current, correctLetter.audioFile, correctLetter.ttsFallback])

  const handleSelect = useCallback(
    (optionId: string) => {
      if (selected !== null) return
      const correct = optionId === question.correctId
      setSelected(optionId)
      setIsCorrect(correct)
      if (correct) setScore((s) => s + 1)

      setTimeout(() => {
        if (current + 1 >= questions.length) {
          onDone(correct ? score + 1 : score)
        } else {
          setCurrent((c) => c + 1)
          setSelected(null)
          setIsCorrect(null)
        }
      }, 800)
    },
    [selected, question.correctId, current, questions.length, onDone, score]
  )

  const progress = (current / questions.length) * 100

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center px-4 py-8">
      <FloatingDeco />

      <motion.div
        className="w-full max-w-sm mx-auto relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-black text-white mb-1">Let's see what you know! ⭐</h2>
          <p className="text-purple-200 font-semibold">Tap the letter you hear</p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-white font-bold text-sm mb-2">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{score} ✅</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-full h-3"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Replay button */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex justify-center mb-6">
              <motion.button
                onClick={() => audioManager.playLetter(correctLetter.audioFile, correctLetter.ttsFallback)}
                className="bg-amber-400 text-amber-900 font-black text-xl px-8 py-4 rounded-2xl shadow-xl shadow-amber-500/40"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
              >
                🔊 Tap to hear
              </motion.button>
            </div>

            {/* Options 2×2 grid — vivid tiles, no white card */}
            <div className="grid grid-cols-2 gap-4">
              {question.options.map((optId, i) => {
                const letter = ARABIC_LETTERS.find((l) => l.id === optId)!
                const isSelected = selected === optId
                const isRight = optId === question.correctId
                const theme = OPTION_COLORS[i % OPTION_COLORS.length]

                let colorClass = theme.base
                if (isSelected && isCorrect) colorClass = theme.correct
                else if (isSelected && !isCorrect) colorClass = theme.wrong
                else if (selected !== null && isRight) colorClass = theme.correct
                else if (selected !== null && !isSelected) colorClass = `${theme.base} opacity-50`

                return (
                  <motion.button
                    key={optId}
                    onClick={() => handleSelect(optId)}
                    disabled={selected !== null}
                    className={`${colorClass} text-white font-black text-6xl py-8 rounded-3xl shadow-xl transition-colors disabled:cursor-not-allowed`}
                    animate={{
                      scale: isSelected && isCorrect ? [1, 1.12, 1] : isSelected && !isCorrect ? [1, 0.92, 1] : 1,
                    }}
                    whileHover={selected === null ? { scale: 1.05 } : {}}
                    whileTap={selected === null ? { scale: 0.95 } : {}}
                    dir="rtl"
                    lang="ar"
                  >
                    {letter.arabic}
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// Step 2 — Result
function ResultStep({ score, onFinish }: { score: number; profileId: string; onFinish: () => void }) {
  const level = score <= 1 ? 0 : score <= 3 ? 1 : 2

  const levelData = [
    { emoji: '🌱', title: 'Beginner ⭐',    message: "Welcome! We'll start from the very beginning 🌱" },
    { emoji: '🚀', title: 'Explorer 🚀',    message: 'Great! You already know some letters!' },
    { emoji: '✨', title: 'Star Learner ✨', message: 'Amazing! You know a lot already!' },
  ]

  const result = levelData[level]

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-900 via-purple-800 to-indigo-900 flex flex-col items-center justify-center px-4">
      <FloatingDeco />
      <motion.div
        className="w-full max-w-sm mx-auto text-center relative z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div
          className="text-9xl mb-4"
          animate={{ y: [0, -16, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        >
          {result.emoji}
        </motion.div>

        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-6 shadow-xl mb-6">
          <h2 className="text-3xl font-black text-white mb-2">{result.title}</h2>
          <p className="text-lg text-purple-200 mb-4">{result.message}</p>
          <div className="bg-amber-400/20 border border-amber-400/40 rounded-2xl p-4">
            <p className="text-2xl font-black text-amber-300">
              You got {score} out of 5 right!
            </p>
          </div>
        </div>

        <motion.button
          onClick={onFinish}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-2xl p-5 rounded-3xl shadow-xl shadow-amber-500/40"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          Start Learning! 🎉
        </motion.button>
      </motion.div>
    </div>
  )
}

// Main OnboardingPage
export function OnboardingPage() {
  const { profileId } = useParams<{ profileId: string }>()
  const navigate = useNavigate()
  const { profiles } = useProfileStore()
  const { initProfile, applyPlacementLevel } = useProgressStore()
  const { markCompleted } = useOnboardingStore()

  const [step, setStep] = useState(0)
  const [score, setScore] = useState(0)
  const [questions] = useState<Question[]>(() => buildQuestions())

  const profile = profiles.find((p) => p.id === profileId)
  const profileName = profile?.name ?? 'Friend'

  const handleStart = () => {
    audioManager.init()
    setStep(1)
  }

  const handleTestDone = (finalScore: number) => {
    setScore(finalScore)
    setStep(2)
  }

  const handleFinish = () => {
    if (!profileId) return
    const level = score <= 1 ? 0 : score <= 3 ? 1 : 2
    initProfile(profileId)
    applyPlacementLevel(profileId, level)
    markCompleted(profileId, level)
    navigate('/home')
  }

  return (
    <AnimatePresence mode="wait">
      {step === 0 && (
        <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <WelcomeStep name={profileName} onStart={handleStart} />
        </motion.div>
      )}
      {step === 1 && (
        <motion.div key="placement" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <PlacementStep questions={questions} onDone={handleTestDone} />
        </motion.div>
      )}
      {step === 2 && (
        <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ResultStep score={score} profileId={profileId ?? ''} onFinish={handleFinish} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
