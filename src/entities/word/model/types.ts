export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'

/** A dictionary entry: the atom of the Lexicon Master domain. */
export interface Word {
  readonly id: string
  readonly term: string
  readonly partOfSpeech: PartOfSpeech
  readonly definition: string
}
