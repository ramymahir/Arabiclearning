export type Harakah =
  | 'fatha'
  | 'kasra'
  | 'damma'
  | 'sukun'
  | 'shadda'
  | 'tanwin_an'
  | 'tanwin_in'
  | 'tanwin_un'
  | 'mad_alef'
  | 'mad_ya'
  | 'mad_waw'

export interface LetterForms {
  isolated: string
  beginning: string
  middle: string
  end: string
}

export interface WordExample {
  arabic: string
  transliteration: string
  meaning: string
  emoji: string
  audioFile?: string
  harakah?: 'fatha' | 'kasra' | 'damma'
}

export interface ArabicLetter {
  id: string
  arabic: string
  transliteration: string
  phonemeDescription: string
  audioFile: string
  ttsFallback: string
  forms: LetterForms
  examples: WordExample[]
  order: number
}

export type ExerciseType =
  | 'teach'
  | 'listen_pick'
  | 'match'
  | 'dragdrop'
  | 'speak'
  | 'word_listen'    // hear a word, pick the correct Arabic written form
  | 'word_match'     // see Arabic word + emoji, match to English meaning
  | 'sentence_read'  // tap words in sentence to hear them, pick overall meaning
  | 'harakah_pick'   // play a voweled letter sound, identify the harakah mark
  | 'pick_letter'    // see a word with missing first letter, pick it from 4 options
  | 'word_build'     // hear a word, tap letter tiles in order to spell it

export interface ArabicSentence {
  id: string
  arabic: string
  transliteration: string
  meaning: string
  emoji: string
  lessonIntroduced: number
}

export interface LessonExercise {
  id: string
  type: ExerciseType
  letterId: string
  promptText?: string
  correctAnswer: string
  distractors: string[]
  wordExample?: WordExample
  sentence?: ArabicSentence
  wordHint?: string   // for pick_letter: the word with first letter replaced by placeholder
}

export interface LessonUnit {
  id: number
  title: string
  titleArabic: string
  description: string
  color: string
  bgColor: string
  textColor: string
  lessons: number[]
  track: 'letters' | 'words' | 'sentences'
}

export interface Lesson {
  id: number
  unitId: number
  title: string
  titleArabic: string
  description: string
  letterIds: string[]
  harakah: Harakah
  exercises: LessonExercise[]
  xpReward: number
  isReview: boolean
}
