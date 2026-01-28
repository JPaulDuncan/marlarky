/**
 * Public API Types
 * Based on TDD Section 4 - Public API
 */

import type { Lexicon } from './lexicon.js';
import type { GeneratorConfig } from './config.js';
import type { IRng } from '../interfaces/rng.js';
import type { IFakerAdapter } from '../interfaces/faker-adapter.js';
import type { OutputTransformsConfig, OutputTokenTrace, TransformEvent } from '../transforms/types.js';

/** Options for TextGenerator constructor */
export interface GeneratorInitOptions {
  /** Lexicon to use (optional - system works without it) */
  lexicon?: Lexicon;
  /** Faker adapter for fallback word generation (required) */
  fakerAdapter: IFakerAdapter;
  /** Custom RNG implementation (optional - uses internal seedable RNG) */
  rng?: IRng;
  /** Generator configuration (optional - uses defaults) */
  config?: Partial<GeneratorConfig>;
  /** Enable tracing for debugging (default false) */
  enableTrace?: boolean;
}

/** Options for sentence generation */
export interface SentenceOptions {
  /** Override sentence type */
  type?: 'simpleDeclarative' | 'compound' | 'introAdverbial' | 'subordinate' | 'interjection' | 'question';
  /** Context hints (tags to activate) */
  hints?: string[];
  /** Minimum word count */
  minWords?: number;
  /** Maximum word count */
  maxWords?: number;
  /** Per-call output transform overrides */
  outputTransforms?: Partial<OutputTransformsConfig>;
  /** How to merge pipeline with base config */
  mergeMode?: 'replace' | 'append';
}

/** Options for paragraph generation */
export interface ParagraphOptions {
  /** Number of sentences (default: random within config range) */
  sentences?: number;
  /** Minimum sentences */
  minSentences?: number;
  /** Maximum sentences */
  maxSentences?: number;
  /** Context hints (tags to activate) */
  hints?: string[];
  /** Per-call output transform overrides */
  outputTransforms?: Partial<OutputTransformsConfig>;
  /** How to merge pipeline with base config */
  mergeMode?: 'replace' | 'append';
}

/** Options for text block generation */
export interface TextBlockOptions {
  /** Number of paragraphs */
  paragraphs?: number;
  /** Minimum paragraphs */
  minParagraphs?: number;
  /** Maximum paragraphs */
  maxParagraphs?: number;
  /** Context hints (tags to activate) */
  hints?: string[];
  /** Per-call output transform overrides */
  outputTransforms?: Partial<OutputTransformsConfig>;
  /** How to merge pipeline with base config */
  mergeMode?: 'replace' | 'append';
}

/** Trace entry for a single token */
export interface TokenTrace {
  /** The token value */
  value: string;
  /** Source: lexicon term set ID or faker method */
  source: string;
  /** Part of speech */
  pos?: string;
  /** Applied correlations */
  correlationsApplied?: string[];
  /** Retry count if any */
  retryCount?: number;
}

/** Trace entry for a sentence */
export interface SentenceTrace {
  /** The sentence text */
  text: string;
  /** Template used */
  template: string;
  /** Token traces */
  tokens: TokenTrace[];
  /** Constraints evaluated */
  constraintsEvaluated: Array<{ id: string; passed: boolean }>;
  /** Total retry count */
  retryCount: number;
}

/** Trace entry for a paragraph */
export interface ParagraphTrace {
  /** Sentence traces */
  sentences: SentenceTrace[];
}

/** Full generation trace */
export interface GenerationTrace {
  /** Paragraph traces */
  paragraphs: ParagraphTrace[];
  /** Correlations applied during generation */
  correlationsApplied: string[];
  /** Invariants checked */
  invariantsChecked: Array<{ id: string; passed: boolean }>;
  /** Output token traces from transforms (original vs transformed) */
  outputTokens?: OutputTokenTrace[];
  /** Transform events from the pipeline */
  transformEvents?: TransformEvent[];
}

/** Generation metadata */
export interface GenerationMeta {
  /** Active archetype */
  archetype: string;
  /** Seed used */
  seed: number;
  /** Lexicon version if loaded */
  lexiconVersion?: string;
  /** Lexicon ID if loaded */
  lexiconId?: string;
  /** IDs of transforms that were applied */
  transformsApplied?: string[];
}

/** Generated text with optional trace */
export interface GeneratedText {
  /** The generated text */
  text: string;
  /** Generation trace (when tracing enabled) */
  trace?: GenerationTrace;
  /** Generation metadata */
  meta: GenerationMeta;
}

/** Lexicon validation error */
export interface LexiconValidationError {
  /** Error path (e.g., "termSets.noun.tech.terms[0]") */
  path: string;
  /** Error message */
  message: string;
  /** Severity */
  severity: 'error' | 'warning';
}

/** Lexicon validation result */
export interface LexiconValidationResult {
  /** Whether the lexicon is valid */
  valid: boolean;
  /** Validation errors */
  errors: LexiconValidationError[];
  /** Validation warnings */
  warnings: LexiconValidationError[];
}
