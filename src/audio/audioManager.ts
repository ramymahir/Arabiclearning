import { Howl, Howler } from 'howler'

class AudioManager {
  private cache: Map<string, Howl> = new Map()
  private arabicVoice: SpeechSynthesisVoice | null = null
  private sfxCache: Map<string, Howl> = new Map()
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return
    this.initialized = true
    Howler.volume(0.8)
    if ('speechSynthesis' in window) {
      const load = () => {
        const voices = window.speechSynthesis.getVoices()
        this.arabicVoice =
          voices.find((v) => v.lang === 'ar-SA') ??
          voices.find((v) => v.lang === 'ar-EG') ??
          voices.find((v) => v.lang.startsWith('ar')) ??
          null
      }
      load()
      window.speechSynthesis.addEventListener('voiceschanged', load)
    }
  }

  private getOrCreate(src: string): Howl {
    if (this.cache.has(src)) return this.cache.get(src)!
    const howl = new Howl({ src: [`/${src}`], html5: false, preload: false })
    this.cache.set(src, howl)
    return howl
  }

  playLetter(audioFile: string, ttsFallback: string): void {
    this.stopLetters()
    const howl = this.getOrCreate(audioFile)
    howl.once('loaderror', () => this.tts(ttsFallback))
    howl.once('playerror', () => this.tts(ttsFallback))
    if (howl.state() === 'loaded') {
      howl.play()
    } else {
      howl.load()
      howl.once('load', () => howl.play())
      // Fallback if audio file doesn't exist
      setTimeout(() => {
        if (howl.state() !== 'loaded') this.tts(ttsFallback)
      }, 600)
    }
  }

  playWord(audioFile: string | undefined, arabicText: string): void {
    if (audioFile) {
      const howl = this.getOrCreate(audioFile)
      howl.once('loaderror', () => this.tts(arabicText))
      howl.load()
      howl.once('load', () => howl.play())
    } else {
      this.tts(arabicText)
    }
  }

  playSFX(name: 'correct' | 'wrong' | 'levelup' | 'heartbreak' | 'complete'): void {
    const file = `audio/sfx/${name}.mp3`
    if (!this.sfxCache.has(file)) {
      const h = new Howl({ src: [`/${file}`], html5: false, preload: false, volume: 0.6 })
      this.sfxCache.set(file, h)
    }
    const sfx = this.sfxCache.get(file)!
    sfx.load()
    sfx.once('load', () => sfx.play())
    sfx.once('loaderror', () => this.playSFXTone(name))
  }

  private playSFXTone(name: string): void {
    try {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      if (name === 'correct') {
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2)
      } else if (name === 'wrong') {
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.15)
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime)
      }
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    } catch {
      // AudioContext not available
    }
  }

  private tts(text: string): void {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = 'ar-SA'
    utter.rate = 0.85
    utter.pitch = 1.0
    if (this.arabicVoice) utter.voice = this.arabicVoice
    window.speechSynthesis.speak(utter)
  }

  stopLetters(): void {
    this.cache.forEach((h) => h.stop())
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
  }

  stopAll(): void {
    this.stopLetters()
    this.sfxCache.forEach((h) => h.stop())
  }
}

export const audioManager = new AudioManager()
