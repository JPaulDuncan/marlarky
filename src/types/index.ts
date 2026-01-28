// Lexicon types
export type {
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
} from './lexicon.js';

// Context types
export type {
  GenerationContext,
  GenerationHistory,
  PhraseFeatures,
  ScopeEntry,
} from './context.js';
export {
  createContext,
  pushScope,
  popScope,
  currentScope,
  recordChoice,
  clearSentenceState,
  clearParagraphState,
} from './context.js';

// Config types
export type {
  GeneratorConfig,
  SentenceTypeWeights,
} from './config.js';
export { DEFAULT_CONFIG, mergeConfig } from './config.js';

// API types
export type {
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
} from './api.js';
