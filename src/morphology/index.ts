// Articles
export { useAn, getIndefiniteArticle, withIndefiniteArticle } from './articles.js';

// Pluralization
export { pluralize, singularize, isPlural } from './pluralize.js';

// Conjugation
export {
  getPastTense,
  getPastParticiple,
  getPresentParticiple,
  getThirdPersonSingular,
  conjugateBe,
  conjugateHave,
  conjugateDo,
  conjugate,
} from './conjugate.js';
export type { Tense, Aspect, ConjugationOptions } from './conjugate.js';

// Normalization
export {
  normalizeWhitespace,
  capitalize,
  capitalizeSentences,
  ensureEndPunctuation,
  isCapitalized,
  endsWithPunctuation,
  hasNoDoubleSpaces,
  joinTokens,
  formatSentence,
  formatParagraph,
  formatTextBlock,
} from './normalize.js';
