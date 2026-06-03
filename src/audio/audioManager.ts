import { Howl, Howler } from 'howler'

class AudioManager {
  private cache: Map<string, Howl> = new Map()
  private confirmedLoaded = new Set<string>()
  private arabicVoice: SpeechSynthesisVoice | null = null
  private initialized = false
  private ttsSupported = false

  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
    Howler.volume(0.8)
    this.loadArabicVoice()
  }

  private loadArabicVoice(): void {
    if (!('speechSynthesis' in window)) return
    this.ttsSupported = true
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
    // If we've already confirmed this MP3 loaded, use it
    if (this.confirmedLoaded.has(audioFile)) {
      const howl = this.cache.get(audioFile)
      if (howl) {
        howl.stop()
        howl.play()
        return
      }
    }

    // Use TTS — cancel any pending speech then speak after a tick
    // (Chrome drops speak() if called synchronously after cancel())
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setTimeout(() => this.ttsSpeak(ttsFallback), 50)
    }

    // Background-load MP3 so it'll be used once available
    this.backgroundLoad(audioFile)
  }

  playWord(audioFile: string | undefined, arabicText: string): void {
    if (audioFile && this.confirmedLoaded.has(audioFile)) {
      const howl = this.cache.get(audioFile)
      if (howl) { howl.stop(); howl.play(); return }
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setTimeout(() => this.ttsSpeak(arabicText), 50)
    }

    if (audioFile) this.backgroundLoad(audioFile)
  }

  playSFX(name: 'correct' | 'wrong' | 'levelup' | 'heartbreak' | 'complete'): void {
    const file = `audio/sfx/${name}.mp3`
    if (this.confirmedLoaded.has(file)) {
      const h = this.cache.get(file)
      if (h) { h.stop(); h.play(); return }
    }
    this.playSFXTone(name)
    this.backgroundLoad(file)
  }

  private ttsSpeak(text: string): void {
    if (!('speechSynthesis' in window)) return
    if (!this.initialized) this.init()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ar-SA'
    utter.rate = 0.8
    utter.pitch = 1.0

    // Only set voice if we found one — otherwise browser picks based on lang
    if (this.arabicVoice) utter.voice = this.arabicVoice

    utter.onerror = (e) => {
      // 'interrupted' is normal when we cancel before replaying — ignore it
      if (e.error !== 'interrupted') {
        console.warn('TTS error:', e.error)
      }
    }

    window.speechSynthesis.speak(utter)
  }

  private backgroundLoad(src: string): void {
    if (this.cache.has(src)) return
    const howl = new Howl({
      src: [`/${src}`],
      html5: false,
      preload: true,
      volume: 0.8,
      onload: () => this.confirmedLoaded.add(src),
      onloaderror: () => this.cache.delete(src),
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
          osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)
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
      // AudioContext unavailable
    }
  }

  stopLetters(): void {
    this.cache.forEach((h) => { if (h.playing()) h.stop() })
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  stopAll(): void { this.stopLetters() }

  getVoiceStatus(): { ttsAvailable: boolean; arabicVoice: string | null } {
    return {
      ttsAvailable: 'speechSynthesis' in window,
      arabicVoice: this.arabicVoice?.name ?? null,
    }
  }
}

export const audioManager = new AudioManager()
