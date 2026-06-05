import type { Harakah, ArabicLetter, WordExample } from '@/types'

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

export function getExampleByHarakah(letter: ArabicLetter, harakah: Harakah): WordExample {
  const target: Harakah =
    harakah === 'fatha' || harakah === 'kasra' || harakah === 'damma' ? harakah : 'fatha'
  return (
    letter.examples.find((ex) => ex.harakah === target) ??
    letter.examples.find((ex) => ex.harakah === 'fatha') ??
    letter.examples[0]
  )
}

/**
 * Splits an Arabic word into an array of letter+harakah grapheme pairs.
 * e.g. 'بَيْت' → ['بَ', 'يْ', 'ت']
 */
export function splitArabicWord(word: string): string[] {
  const segments: string[] = []
  let current = ''
  for (const char of word) {
    const code = char.codePointAt(0) ?? 0
    // Arabic combining marks: U+0610-U+061A (extended), U+064B-U+065F (harakah/shadda), U+0670 (superscript alef)
    const isCombining =
      (code >= 0x0610 && code <= 0x061a) ||
      (code >= 0x064b && code <= 0x065f) ||
      code === 0x0670
    if (isCombining) {
      current += char
    } else {
      if (current) segments.push(current)
      current = char
    }
  }
  if (current) segments.push(current)
  return segments
}

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
