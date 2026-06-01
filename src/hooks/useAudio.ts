import { useCallback } from 'react'
import { audioManager } from '@/audio/audioManager'
import type { ArabicLetter, WordExample } from '@/types'

export function useAudio() {
  const playLetter = useCallback((letter: ArabicLetter) => {
    audioManager.playLetter(letter.audioFile, letter.ttsFallback)
  }, [])

  const playWord = useCallback((word: WordExample) => {
    audioManager.playWord(word.audioFile, word.arabic)
  }, [])

  const playSFX = useCallback(
    (name: 'correct' | 'wrong' | 'levelup' | 'heartbreak' | 'complete') => {
      audioManager.playSFX(name)
    },
    []
  )

  const stopAll = useCallback(() => audioManager.stopAll(), [])

  return { playLetter, playWord, playSFX, stopAll }
}
