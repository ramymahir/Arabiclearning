export type GamePhase = 'intro' | 'playing' | 'result'
export type AnswerResult = 'correct' | 'wrong' | 'pending'

export interface GameSession {
  lessonId: number
  profileId: string
  startTime: number
  exerciseIndex: number
  totalExercises: number
  correctCount: number
  wrongCount: number
  xpEarned: number
  heartsAtStart: number
  heartsRemaining: number
  phase: GamePhase
}

export interface XPEvent {
  id: string
  amount: number
  label: string
  triggeredAt: number
}
