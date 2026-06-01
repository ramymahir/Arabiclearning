import { create } from 'zustand'
import type { GameSession, GamePhase, AnswerResult, XPEvent } from '@/types'
import { HEARTS_MAX, XP_PER_CORRECT } from '@/data/constants'

interface GameStore {
  session: GameSession | null
  currentAnswerResult: AnswerResult
  xpEvents: XPEvent[]
  startSession: (lessonId: number, profileId: string, totalExercises: number, hearts: number) => void
  submitAnswer: (isCorrect: boolean) => void
  nextExercise: () => void
  setPhase: (phase: GamePhase) => void
  addXPEvent: (amount: number, label: string) => void
  clearXPEvent: (id: string) => void
  endSession: () => void
}

export const useGameStore = create<GameStore>()((set, get) => ({
  session: null,
  currentAnswerResult: 'pending',
  xpEvents: [],

  startSession(lessonId, profileId, totalExercises, hearts) {
    set({
      session: {
        lessonId,
        profileId,
        startTime: Date.now(),
        exerciseIndex: 0,
        totalExercises,
        correctCount: 0,
        wrongCount: 0,
        xpEarned: 0,
        heartsAtStart: hearts,
        heartsRemaining: hearts,
        phase: 'playing',
      },
      currentAnswerResult: 'pending',
      xpEvents: [],
    })
  },

  submitAnswer(isCorrect) {
    const s = get().session
    if (!s) return
    const xpGained = isCorrect ? XP_PER_CORRECT : 0
    set({
      currentAnswerResult: isCorrect ? 'correct' : 'wrong',
      session: {
        ...s,
        correctCount: s.correctCount + (isCorrect ? 1 : 0),
        wrongCount: s.wrongCount + (isCorrect ? 0 : 1),
        xpEarned: s.xpEarned + xpGained,
        heartsRemaining: isCorrect ? s.heartsRemaining : Math.max(0, s.heartsRemaining - 1),
      },
    })
    if (isCorrect && xpGained > 0) {
      get().addXPEvent(xpGained, `+${xpGained} XP`)
    }
  },

  nextExercise() {
    const s = get().session
    if (!s) return
    set({
      currentAnswerResult: 'pending',
      session: { ...s, exerciseIndex: s.exerciseIndex + 1 },
    })
  },

  setPhase(phase) {
    const s = get().session
    if (!s) return
    set({ session: { ...s, phase } })
  },

  addXPEvent(amount, label) {
    const event: XPEvent = { id: crypto.randomUUID(), amount, label, triggeredAt: Date.now() }
    set((s) => ({ xpEvents: [...s.xpEvents, event] }))
  },

  clearXPEvent(id) {
    set((s) => ({ xpEvents: s.xpEvents.filter((e) => e.id !== id) }))
  },

  endSession() {
    set({ session: null, currentAnswerResult: 'pending', xpEvents: [] })
  },
}))
