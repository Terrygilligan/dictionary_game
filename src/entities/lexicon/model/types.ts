export interface WordCoordinate {
  scroll: string
  page: number
  column: number
  wordNumber: number
}

export interface LexiconWord {
  id: string
  word: string
  definition: string
  coord: WordCoordinate
}

export interface LexiconDataset {
  words: LexiconWord[]
}
