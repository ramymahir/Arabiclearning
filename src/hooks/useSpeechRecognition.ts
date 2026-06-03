import { useState, useRef, useCallback, useEffect } from 'react'

// Minimal Web Speech API types (not universally in DOM lib)
interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null
  onend: (() => void) | null
}

interface SpeechRecognitionResultEvent {
  results: { [index: number]: { [index: number]: { transcript: string; confidence: number } } }
}

interface SpeechRecognitionErrorEvent {
  error: string
}

interface SpeechRecognitionConstructor {
  new(): SpeechRecognitionInstance
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

interface UseSpeechRecognitionResult {
  supported: boolean
  listening: boolean
  transcript: string
  confidence: number
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
}

export function useSpeechRecognition(
  lang = 'ar-SA',
  timeoutMs = 5000
): UseSpeechRecognitionResult {
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [confidence, setConfidence] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supported =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  const stop = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const start = useCallback(() => {
    if (!supported) return
    setError(null)
    setTranscript('')
    setConfidence(0)

    const SR = (window.SpeechRecognition ?? window.webkitSpeechRecognition)!
    const recognition = new SR()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (e) => {
      const result = e.results[0]?.[0]
      if (result) {
        setTranscript(result.transcript)
        setConfidence(result.confidence)
      }
      setListening(false)
    }

    recognition.onerror = (e) => {
      // 'no-speech' is normal when child is silent
      if (e.error !== 'no-speech') setError(e.error)
      setListening(false)
    }

    recognition.onend = () => {
      setListening(false)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)

    timeoutRef.current = setTimeout(() => recognition.stop(), timeoutMs)
  }, [supported, lang, timeoutMs])

  const reset = useCallback(() => {
    stop()
    setTranscript('')
    setConfidence(0)
    setError(null)
  }, [stop])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  return { supported, listening, transcript, confidence, error, start, stop, reset }
}
