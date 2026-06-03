// Cache of Arabic text → blob object URLs to avoid re-fetching
const audioCache = new Map<string, string>()

async function playViaAPI(text: string): Promise<void> {
  if (!audioCache.has(text)) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
    if (!res.ok) throw new Error(`TTS API ${res.status}`)
    const blob = await res.blob()
    audioCache.set(text, URL.createObjectURL(blob))
  }
  const url = audioCache.get(text)!
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
    // (works in Capacitor WebView via Android's built-in TTS engine)
  }
  playViaBrowser(text)
}

export function clearTTSCache(): void {
  audioCache.forEach((url) => URL.revokeObjectURL(url))
  audioCache.clear()
}
