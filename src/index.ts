/**
 * LSETG - Lexicon-Steered English Syntax Text Generator
 * A faker-like library for generating syntactically plausible English text
 */

// Main API
export { TextGenerator } from './generator/index.js';

// Adapters
export { FakerJsAdapter, SimpleFakerAdapter } from './adapters/index.js';

// Lexicon utilities
export { LexiconStore, validateLexicon, loadLexiconFromString, loadLexiconFromObject, tryLoadLexicon } from './lexicon/index.js';

// RNG
export { SeedableRng } from './rng/index.js';

// Morphology utilities
export {
  // Articles
  useAn,
  getIndefiniteArticle,
  withIndefiniteArticle,
  // Pluralization
  pluralize,
  singularize,
  isPlural,
  // Conjugation
  getPastTense,
  getPastParticiple,
  getPresentParticiple,
  getThirdPersonSingular,
  conjugateBe,
  conjugateHave,
  conjugateDo,
  conjugate,
  // Normalization
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
} from './morphology/index.js';

// Output Transform System
export {
  // Tokenizer
  tokenize,
  render,
  classifyChar,
  // Protection
  applyProtection,
  isProtected,
  // Registry
  TransformRegistry,
  createDefaultRegistry,
  // Pipeline
  executePipeline,
  checkPipelineOrder,
  // Config Merge
  mergeOutputTransformsConfig,
  mergeProtectionConfig,
  // Constants
  DEFAULT_PROTECTION_CONFIG,
  DEFAULT_OUTPUT_TRANSFORMS_CONFIG,
  // V1 Transforms
  pigLatinTransform,
  ubbiDubbiTransform,
  leetTransform,
  uwuTransform,
  pirateTransform,
  redactTransform,
  emojiTransform,
  mockCaseTransform,
  reverseWordsTransform,
  bizJargonTransform,
  V1_TRANSFORMS,
} from './transforms/index.js';

// Types
export type {
  // Interfaces
  IRng,
  WeightedItem,
  IFakerAdapter,
  ILexiconStore,
} from './interfaces/index.js';

export type {
  // Lexicon types
  Lexicon,
  TermSet,
  Term,
  TermFeatures,
  LexicalItem,
  Pattern,
  DistributionEntry,
  Correlation,
  CorrelationCondition,
  CorrelationBoost,
  Constraint,
  Invariant,
  Archetype,
  Relation,
  TermQuery,
  PatternQuery,
  ChoiceEvent,
  RelationResult,
  POS,
  // Context types
  GenerationContext,
  GenerationHistory,
  PhraseFeatures,
  ScopeEntry,
  // Config types
  GeneratorConfig,
  SentenceTypeWeights,
  // API types
  GeneratorInitOptions,
  SentenceOptions,
  ParagraphOptions,
  TextBlockOptions,
  TokenTrace,
  SentenceTrace,
  ParagraphTrace,
  GenerationTrace,
  GenerationMeta,
  GeneratedText,
  LexiconValidationError,
  LexiconValidationResult,
} from './types/index.js';

export { DEFAULT_CONFIG, mergeConfig } from './types/index.js';

// Conjugation types
export type { Tense, Aspect, ConjugationOptions } from './morphology/conjugate.js';

// Grammar types
export type { SentenceType, SentenceResult, PhraseResult } from './grammar/index.js';

// Transform types
export type {
  Token,
  TokenType,
  TokenMeta,
  ProtectionConfig,
  TransformStep,
  OutputTransformsConfig,
  OutputTransformsOverride,
  TransformCapabilities,
  TransformInput,
  TransformOutput,
  ValidationResult as TransformValidationResult,
  IOutputTransform,
  OutputTokenTrace,
  TransformEvent,
  LexiconOutputTransforms,
  ArchetypeOutputTransforms,
  PipelineResult,
} from './transforms/index.js';
