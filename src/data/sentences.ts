import type { ArabicSentence } from '@/types'

export const SENTENCES: ArabicSentence[] = [
  { id: 's01', arabic: 'بَيْتٌ كَبِيرٌ', transliteration: 'baytun kabirun', meaning: 'a big house', emoji: '🏠', lessonIntroduced: 17 },
  { id: 's02', arabic: 'قِطٌّ صَغِيرٌ', transliteration: 'qittun saghirun', meaning: 'a small cat', emoji: '🐱', lessonIntroduced: 17 },
  { id: 's03', arabic: 'كَلْبٌ أَبْيَضُ', transliteration: 'kalbun abyadu', meaning: 'a white dog', emoji: '🐕', lessonIntroduced: 17 },
  { id: 's04', arabic: 'سَمَكَةٌ زَرْقَاءُ', transliteration: 'samakatun zarqau', meaning: 'a blue fish', emoji: '🐟', lessonIntroduced: 17 },
  { id: 's05', arabic: 'نَجْمٌ جَمِيلٌ', transliteration: 'najmun jamilun', meaning: 'a beautiful star', emoji: '⭐', lessonIntroduced: 17 },
  { id: 's06', arabic: 'قَمَرٌ مُضِيءٌ', transliteration: 'qamarun mudiu', meaning: 'a bright moon', emoji: '🌙', lessonIntroduced: 17 },
  { id: 's07', arabic: 'مَاءٌ بَارِدٌ', transliteration: 'maun baridun', meaning: 'cold water', emoji: '💧', lessonIntroduced: 18 },
  { id: 's08', arabic: 'تُفَّاحَةٌ حَمْرَاءُ', transliteration: 'tuffahatun hamrau', meaning: 'a red apple', emoji: '🍎', lessonIntroduced: 18 },
  { id: 's09', arabic: 'جَمَلٌ كَبِيرٌ', transliteration: 'jamalun kabirun', meaning: 'a big camel', emoji: '🐪', lessonIntroduced: 18 },
  { id: 's10', arabic: 'شَجَرَةٌ خَضْرَاءُ', transliteration: 'shajaratun khadhrau', meaning: 'a green tree', emoji: '🌳', lessonIntroduced: 18 },
  { id: 's11', arabic: 'وَلَدٌ سَعِيدٌ', transliteration: 'waladun sa\'idun', meaning: 'a happy boy', emoji: '😊', lessonIntroduced: 18 },
  { id: 's12', arabic: 'بِنْتٌ لَطِيفَةٌ', transliteration: 'bintun latifatun', meaning: 'a kind girl', emoji: '👧', lessonIntroduced: 19 },
  { id: 's13', arabic: 'حِصَانٌ سَرِيعٌ', transliteration: 'hisanun sari\'un', meaning: 'a fast horse', emoji: '🐎', lessonIntroduced: 19 },
  { id: 's14', arabic: 'لَيْلٌ هَادِئٌ', transliteration: 'laylun hadi\'un', meaning: 'a quiet night', emoji: '🌃', lessonIntroduced: 19 },
  { id: 's15', arabic: 'يَوْمٌ جَمِيلٌ', transliteration: 'yawmun jamilun', meaning: 'a beautiful day', emoji: '☀️', lessonIntroduced: 19 },
]

export function getSentencesForLesson(lessonId: number): ArabicSentence[] {
  return SENTENCES.filter((s) => s.lessonIntroduced <= lessonId)
}
