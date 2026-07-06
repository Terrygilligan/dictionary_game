export interface WordCoordinate {
  scroll: string
  page: number
  column: number
  wordNumber: number
}

export interface LexiconWord {
  id: string
  conceptId: string
  translations: { [lang: string]: string } // 'en', 'bg', etc.
  definitions: { [lang: string]: string }
  coord: WordCoordinate
}

export interface LexiconDataset {
  words: LexiconWord[]
}
