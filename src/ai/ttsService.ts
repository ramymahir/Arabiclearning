import { getCachedAudio, setCachedAudio } from '@/utils/ttsCache'

// Session-level L1 cache: text → blob URL
const audioCache = new Map<string, string>()

async function playViaAPI(text: string): Promise<void> {
  // L1: in-memory blob URL
  if (audioCache.has(text)) {
    const audio = new Audio(audioCache.get(text)!)
    audio.volume = 0.8
    return new Promise((resolve) => {
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }
  // L2: persistent cache
  const cached = await getCachedAudio(text)
  if (cached) {
    const url = URL.createObjectURL(new Blob([cached], { type: 'audio/mpeg' }))
    audioCache.set(text, url)
    const audio = new Audio(url)
    audio.volume = 0.8
    return new Promise((resolve) => {
      audio.onended = () => resolve()
      audio.onerror = () => resolve()
      audio.play().catch(() => resolve())
    })
  }
  // L3: fetch from API — store in both caches
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, role: 'teacher' }),
  })
  if (!res.ok) throw new Error(`TTS API ${res.status}`)
  const buffer = await res.arrayBuffer()
  setCachedAudio(text, buffer) // fire-and-forget persist
  const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/mpeg' }))
  audioCache.set(text, url)
  const audio = new Audio(url)
  audio.volume = 0.8
  return new Promise((resolve) => {
    audio.onended = () => resolve()
    audio.onerror = () => resolve()
    audio.play().catch(() => resolve())
  })
}

function playViaBrowser(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  setTimeout(() => {
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ar-SA'
    utter.rate = 0.8
    utter.pitch = 1.0
    window.speechSynthesis.speak(utter)
  }, 50)
}

export async function speakArabic(text: string): Promise<void> {
  try {
    await playViaAPI(text)
    return
  } catch {
    // fall through to browser TTS
  }
  playViaBrowser(text)
}

export function clearTTSCache(): void {
  audioCache.forEach((url) => URL.revokeObjectURL(url))
  audioCache.clear()
}
