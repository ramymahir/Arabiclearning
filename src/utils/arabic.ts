import type { Harakah } from '@/types'

const HARAKAH_CHARS: Record<Harakah, string> = {
  fatha: 'َ',      // َ
  kasra: 'ِ',      // ِ
  damma: 'ُ',      // ُ
  sukun: 'ْ',      // ْ
  shadda: 'ّ',     // ّ
  tanwin_an: 'ً',  // ً
  tanwin_in: 'ٍ',  // ٍ
  tanwin_un: 'ٌ',  // ٌ
  mad_alef: 'َا',   // َا (fatha + alef)
  mad_ya: 'ِي',     // ِي (kasra + ya)
  mad_waw: 'ُو',    // ُو (damma + waw)
}

export const getHarakahChar = (h: Harakah): string => HARAKAH_CHARS[h] ?? ''

export const applyHarakah = (letter: string, h: Harakah): string =>
  letter + getHarakahChar(h)

export const HARAKAH_DESCRIPTIONS: Record<Harakah, { ar: string; en: string; sound: string }> = {
  fatha: { ar: 'فَتْحَة', en: 'Fatha', sound: 'a' },
  kasra: { ar: 'كَسْرَة', en: 'Kasra', sound: 'i' },
  damma: { ar: 'ضَمَّة', en: 'Damma', sound: 'u' },
  sukun: { ar: 'سُكُون', en: 'Sukun', sound: '(silent)' },
  shadda: { ar: 'شَدَّة', en: 'Shadda', sound: '(doubled)' },
  tanwin_an: { ar: 'تَنْوِين الْفَتْح', en: 'Tanwin Fath', sound: 'an' },
  tanwin_in: { ar: 'تَنْوِين الْكَسْر', en: 'Tanwin Kasr', sound: 'in' },
  tanwin_un: { ar: 'تَنْوِين الضَّم', en: 'Tanwin Damm', sound: 'un' },
  mad_alef: { ar: 'مَدّ الْأَلِف', en: 'Long Alef', sound: 'aa' },
  mad_ya: { ar: 'مَدّ الْيَاء', en: 'Long Ya', sound: 'ee' },
  mad_waw: { ar: 'مَدّ الْوَاو', en: 'Long Waw', sound: 'oo' },
}
