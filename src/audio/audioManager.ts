import { Howl, Howler } from 'howler'

class AudioManager {
  private cache: Map<string, Howl> = new Map()
  private confirmedLoaded = new Set<string>()
  private arabicVoice: SpeechSynthesisVoice | null = null
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
    Howler.volume(0.8)
    this.loadArabicVoice()
  }

  private loadArabicVoice(): void {
    if (!('speechSynthesis' in window)) return
    const pick = () => {
      const voices = window.speechSynthesis.getVoices()
      this.arabicVoice =
        voices.find((v) => v.lang === 'ar-SA') ??
        voices.find((v) => v.lang === 'ar-EG') ??
        voices.find((v) => v.lang.startsWith('ar')) ??
        null
    }
    pick()
    window.speechSynthesis.addEventListener('voiceschanged', pick)
  }

  playLetter(audioFile: string, ttsFallback: string): void {
    this.stopLetters()

    // If we've already confirmed this MP3 loaded, use it
    if (this.confirmedLoaded.has(audioFile)) {
      const howl = this.cache.get(audioFile)
      if (howl) { howl.play(); return }
    }

    // Use TTS immediately — it's always available
    this.tts(ttsFallback)

    // Background-load the MP3 so it works when files are added later
    this.backgroundLoad(audioFile)
  }

  playWord(audioFile: string | undefined, arabicText: string): void {
    this.stopLetters()

    if (audioFile && this.confirmedLoaded.has(audioFile)) {
      const howl = this.cache.get(audioFile)
      if (howl) { howl.play(); return }
    }

    this.tts(arabicText)

    if (audioFile) this.backgroundLoad(audioFile)
  }

  playSFX(name: 'correct' | 'wrong' | 'levelup' | 'heartbreak' | 'complete'): void {
    const file = `audio/sfx/${name}.mp3`
    if (this.confirmedLoaded.has(file)) {
      const h = this.cache.get(file)
      if (h) { h.play(); return }
    }
    // Always use tone fallback (files may not exist)
    this.playSFXTone(name)
    this.backgroundLoad(file)
  }

  private backgroundLoad(src: string): void {
    if (this.cache.has(src)) return
    const howl = new Howl({
      src: [`/${src}`],
      html5: false,
      preload: true,
      volume: 0.8,
      onload: () => this.confirmedLoaded.add(src),
      onloaderror: () => {
        // File doesn't exist — remove from cache so we don't retry
        this.cache.delete(src)
      },
    })
    this.cache.set(src, howl)
  }

  private playSFXTone(name: string): void {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      if (name === 'correct') {
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.12)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.24)
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(); osc.stop(ctx.currentTime + 0.5)
      } else if (name === 'wrong') {
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(280, ctx.currentTime)
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.18)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
        osc.start(); osc.stop(ctx.currentTime + 0.35)
      } else if (name === 'complete') {
        osc.type = 'sine'
        ;[523, 659, 784, 1047].forEach((freq, i) => {
          const t = ctx.currentTime + i * 0.1
          osc.frequency.setValueAtTime(freq, t)
        })
        gain.gain.setValueAtTime(0.25, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
        osc.start(); osc.stop(ctx.currentTime + 0.6)
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
        gain.gain.setValueAtTime(0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
        osc.start(); osc.stop(ctx.currentTime + 0.3)
      }
    } catch {
      // AudioContext not available in this environment
    }
  }

  private tts(text: string): void {
    if (!('speechSynthesis' in window)) return
    // Ensure we're initialized
    if (!this.initialized) this.init()
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ar-SA'
    utter.rate = 0.8
    utter.pitch = 1.0
    if (this.arabicVoice) utter.voice = this.arabicVoice
    window.speechSynthesis.speak(utter)
  }

  stopLetters(): void {
    this.cache.forEach((h) => {
      if (h.playing()) h.stop()
    })
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  stopAll(): void {
    this.stopLetters()
  }
}

export const audioManager = new AudioManager()
