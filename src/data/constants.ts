export const HEARTS_MAX = 5
export const HEART_REFILL_MINUTES = 30
export const MAX_PROFILES = 4
export const XP_PER_CORRECT = 10
export const LESSON_COMPLETE_XP = [0, 20, 40, 60] // indexed by stars (0-3)
export const STREAK_BONUS_XP = 15
export const LEVEL_THRESHOLDS = [0, 50, 120, 220, 360, 550, 800, 1100, 1500, 2000]
export const TOTAL_LESSONS = 19
export const TOTAL_LETTERS = 28

export const AVATARS = [
  { id: 1, emoji: '🦁', label: 'Lion' },
  { id: 2, emoji: '🐯', label: 'Tiger' },
  { id: 3, emoji: '🐻', label: 'Bear' },
  { id: 4, emoji: '🦊', label: 'Fox' },
  { id: 5, emoji: '🐧', label: 'Penguin' },
  { id: 6, emoji: '🦄', label: 'Unicorn' },
  { id: 7, emoji: '🐉', label: 'Dragon' },
  { id: 8, emoji: '🌟', label: 'Star' },
]

export const UNIT_COLORS: Record<number, { bg: string; ring: string; text: string; light: string }> = {
  1: { bg: 'bg-emerald-500', ring: 'ring-emerald-600', text: 'text-emerald-700', light: 'bg-emerald-50' },
  2: { bg: 'bg-blue-500', ring: 'ring-blue-600', text: 'text-blue-700', light: 'bg-blue-50' },
  3: { bg: 'bg-purple-500', ring: 'ring-purple-600', text: 'text-purple-700', light: 'bg-purple-50' },
  4: { bg: 'bg-orange-500', ring: 'ring-orange-600', text: 'text-orange-700', light: 'bg-orange-50' },
  5: { bg: 'bg-sky-500', ring: 'ring-sky-600', text: 'text-sky-700', light: 'bg-sky-50' },
  6: { bg: 'bg-pink-500', ring: 'ring-pink-600', text: 'text-pink-700', light: 'bg-pink-50' },
  7: { bg: 'bg-rose-500', ring: 'ring-rose-600', text: 'text-rose-700', light: 'bg-rose-50' },
  8: { bg: 'bg-amber-500', ring: 'ring-amber-600', text: 'text-amber-700', light: 'bg-amber-50' },
}

export const HARAKAH_NAMES: Record<string, { en: string; ar: string; symbol: string }> = {
  fatha: { en: 'Fatha (a)', ar: 'الفتحة', symbol: 'ـَ' },
  kasra: { en: 'Kasra (i)', ar: 'الكسرة', symbol: 'ـِ' },
  damma: { en: 'Damma (u)', ar: 'الضمة', symbol: 'ـُ' },
  sukun: { en: 'Sukun (no vowel)', ar: 'السكون', symbol: 'ـْ' },
  shadda: { en: 'Shadda (doubled)', ar: 'الشدة', symbol: 'ـّ' },
  tanwin_an: { en: 'Tanwin Fath (an)', ar: 'تنوين الفتح', symbol: 'ـً' },
  tanwin_in: { en: 'Tanwin Kasr (in)', ar: 'تنوين الكسر', symbol: 'ـٍ' },
  tanwin_un: { en: 'Tanwin Damm (un)', ar: 'تنوين الضم', symbol: 'ـٌ' },
  mad_alef: { en: 'Long A (aa)', ar: 'مد الألف', symbol: 'ـَا' },
  mad_ya: { en: 'Long I (ee)', ar: 'مد الياء', symbol: 'ـِي' },
  mad_waw: { en: 'Long U (oo)', ar: 'مد الواو', symbol: 'ـُو' },
}

export const LEVEL_NAMES = [
  'Beginner',
  'Explorer',
  'Learner',
  'Reader',
  'Student',
  'Scholar',
  'Expert',
  'Master',
  'Champion',
  'Legend',
]
