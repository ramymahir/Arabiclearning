import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useProfileStore } from '@/store/profileStore'
import { useProgressStore } from '@/store/progressStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { ARABIC_LETTERS } from '@/data/letters'
import { audioManager } from '@/audio/audioManager'

// The 5 test letter IDs spread across the alphabet
const TEST_LETTER_IDS = ['alef', 'seen', 'ain', 'meem', 'ya']

const OPTION_COLORS = [
  'bg-amber-600 hover:bg-amber-700 shadow-amber-500',
  'bg-rose-500 hover:bg-rose-600 shadow-rose-400',
  'bg-sky-500 hover:bg-sky-600 shadow-sky-400',
  'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-400',
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
  options: string[] // letter IDs
}

function buildQuestions(): Question[] {
  return TEST_LETTER_IDS.map((correctId) => {
    const distractors = ARABIC_LETTERS.filter((l) => l.id !== correctId)
    const picked = shuffle(distractors).slice(0, 3).map((l) => l.id)
    const options = shuffle([correctId, ...picked])
    return { correctId, options }
  })
}

// Step 0 — Welcome
function WelcomeStep({ name, onStart }: { name: string; onStart: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-500 to-indigo-600 flex flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm mx-auto text-center"
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
        <p className="text-xl text-purple-100 font-semibold mb-10">
          I'll teach you to read Arabic!
        </p>
        <motion.button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-black text-2xl p-5 rounded-3xl shadow-lg shadow-amber-300/50 active:scale-95"
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
function PlacementStep({
  questions,
  onDone,
}: {
  questions: Question[]
  onDone: (score: number) => void
}) {
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)

  const question = questions[current]
  const correctLetter = ARABIC_LETTERS.find((l) => l.id === question.correctId)!

  // Play audio when question changes
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

  const progress = ((current) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-blue-600 flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        className="w-full max-w-sm mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-white mb-1">
            Let's see what you know! ⭐
          </h2>
          <p className="text-sky-100 font-semibold">Tap the letter you hear</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between text-white font-bold text-sm mb-2">
            <span>Question {current + 1} of {questions.length}</span>
            <span>{score} correct</span>
          </div>
          <div className="w-full bg-sky-700/50 rounded-full h-3">
            <motion.div
              className="bg-white rounded-full h-3"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            className="bg-white rounded-3xl p-6 shadow-xl mb-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
          >
            {/* Replay button */}
            <div className="flex justify-center mb-4">
              <button
                onClick={() =>
                  audioManager.playLetter(
                    correctLetter.audioFile,
                    correctLetter.ttsFallback
                  )
                }
                className="bg-sky-100 hover:bg-sky-200 text-sky-700 rounded-2xl px-6 py-3 text-2xl font-bold active:scale-95 transition-transform"
              >
                🔊 Replay
              </button>
            </div>

            {/* Options 2×2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {question.options.map((optId, i) => {
                const letter = ARABIC_LETTERS.find((l) => l.id === optId)!
                const isSelected = selected === optId
                const isRight = optId === question.correctId

                let extraClasses = ''
                if (isSelected && isCorrect) extraClasses = 'bg-green-400 shadow-green-300 scale-105'
                else if (isSelected && !isCorrect) extraClasses = 'bg-red-400 shadow-red-300 scale-95'
                else if (selected !== null && isRight) extraClasses = 'bg-green-400 shadow-green-300'

                return (
                  <motion.button
                    key={optId}
                    onClick={() => handleSelect(optId)}
                    disabled={selected !== null}
                    className={`${isSelected || (selected && isRight) ? extraClasses : OPTION_COLORS[i]} text-white font-black text-5xl p-6 rounded-2xl shadow-md transition-all active:scale-95 disabled:cursor-not-allowed`}
                    whileHover={selected === null ? { scale: 1.04 } : {}}
                    whileTap={selected === null ? { scale: 0.96 } : {}}
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
function ResultStep({
  score,
  profileId,
  onFinish,
}: {
  score: number
  profileId: string
  onFinish: () => void
}) {
  const level = score <= 1 ? 0 : score <= 3 ? 1 : 2

  const levelData = [
    {
      emoji: '🌱',
      title: 'Beginner ⭐',
      message: "Welcome! We'll start from the very beginning 🌱",
    },
    {
      emoji: '🚀',
      title: 'Explorer 🚀',
      message: 'Great! You already know some letters!',
    },
    {
      emoji: '✨',
      title: 'Star Learner ✨',
      message: 'Amazing! You know a lot already!',
    },
  ]

  const result = levelData[level]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-400 to-orange-500 flex flex-col items-center justify-center px-4">
      <motion.div
        className="w-full max-w-sm mx-auto text-center"
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

        <div className="bg-white rounded-3xl p-6 shadow-xl mb-6">
          <h2 className="text-3xl font-black text-gray-800 mb-2">{result.title}</h2>
          <p className="text-lg text-gray-600 mb-4">{result.message}</p>
          <div className="bg-amber-50 rounded-2xl p-4">
            <p className="text-2xl font-black text-amber-600">
              You got {score} out of 5 right!
            </p>
          </div>
        </div>

        <motion.button
          onClick={onFinish}
          className="w-full bg-white text-orange-500 font-black text-2xl p-5 rounded-3xl shadow-lg shadow-orange-300/50 active:scale-95"
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
