/**
 * Faker Adapter Interface
 * Provides fallback word generation when lexicon doesn't have terms
 */
export interface IFakerAdapter {
  /** Generate an adjective */
  adjective(): string;

  /** Generate an adverb */
  adverb(): string;

  /** Generate a common noun */
  noun(): string;

  /** Generate a verb (base form) */
  verb(): string;

  /** Generate a preposition */
  preposition(): string;

  /** Generate a conjunction */
  conjunction(): string;

  /** Generate an interjection */
  interjection(): string;

  /** Generate a proper noun (name, place, etc.) - optional */
  properNoun?(): string;

  /** Generate a number word or digit - optional */
  number?(): string;
}
