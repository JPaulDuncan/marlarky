/**
 * Lexicon Schema Types
 * Based on TDD Section 6 - Lexicon JSON Schema
 */

import type { LexiconOutputTransforms, ArchetypeOutputTransforms } from '../transforms/types.js';

/** Part of Speech */
export type POS = 'noun' | 'verb' | 'adj' | 'adv' | 'prep' | 'conj' | 'intj' | 'det';

/** Lexicon Root Structure */
export interface Lexicon {
  /** Unique lexicon identifier (required) */
  id: string;
  /** Lexicon version */
  version?: string;
  /** Language code (required) */
  language: string;
  /** Named pools of terms with optional tags and weights */
  termSets?: Record<string, TermSet>;
  /** Syntactic templates at phrase/sentence level */
  patterns?: Record<string, Pattern>;
  /** Distributions that bias choices by archetype/topic */
  distributions?: Record<string, DistributionEntry[]>;
  /** Conditional boosts triggered by choices/events */
  correlations?: Correlation[];
  /** Hard/soft constraints on generation */
  constraints?: Constraint[];
  /** Invariants that must always hold */
  invariants?: Invariant[];
  /** Style presets with biases */
  archetypes?: Record<string, Archetype>;
  /** Relations connecting terms/entities */
  relations?: Relation[];
  /** Output transform defaults for this lexicon */
  outputTransforms?: LexiconOutputTransforms;
}

/** Term Set - A named pool of terms */
export interface TermSet {
  /** Part of speech for this term set */
  pos: POS;
  /** Tags for categorization (e.g., ["domain:tech"]) */
  tags?: string[];
  /** List of terms in this set */
  terms: Term[];
}

/** Individual Term */
export interface Term {
  /** The word/phrase value */
  value: string;
  /** Sampling weight (default 1) */
  weight?: number;
  /** Features used by constraints/morphology */
  features?: TermFeatures;
  /** Additional tags for this specific term */
  tags?: string[];
}

/** Term features for morphology and constraints */
export interface TermFeatures {
  /** Whether the noun is countable */
  countable?: boolean;
  /** Grammatical number */
  number?: 'singular' | 'plural' | 'both';
  /** Grammatical person */
  person?: 1 | 2 | 3;
  /** Verb transitivity */
  transitive?: boolean;
  /** Irregular forms */
  irregular?: {
    plural?: string;
    pastTense?: string;
    pastParticiple?: string;
    presentParticiple?: string;
    thirdPerson?: string;
  };
  /** Custom features */
  [key: string]: unknown;
}

/** A lexical item returned from sampling */
export interface LexicalItem {
  /** The word value */
  value: string;
  /** Part of speech */
  pos: POS;
  /** Source term set ID */
  termSetId?: string;
  /** Features from the term */
  features?: TermFeatures;
  /** Tags */
  tags?: string[];
}

/** Pattern - Syntactic templates */
export interface Pattern {
  /** Pattern type */
  type: 'sentence' | 'nounPhrase' | 'verbPhrase' | 'prepPhrase' | 'adjPhrase' | 'advPhrase' | 'clause';
  /** Slots defining the structure */
  slots: string[];
  /** Constraints applied to this pattern */
  constraints?: string[];
  /** Weight for selection */
  weight?: number;
  /** Tags for categorization */
  tags?: string[];
}

/** Distribution entry for weighted selection */
export interface DistributionEntry {
  /** Key identifier */
  key: string;
  /** Selection weight */
  weight: number;
}

/** Correlation - Conditional boosts */
export interface Correlation {
  /** Condition that triggers the correlation */
  when: CorrelationCondition;
  /** Bias adjustments to apply */
  thenBoost: CorrelationBoost[];
  /** Scope of the correlation effect */
  scope: 'token' | 'phrase' | 'sentence' | 'paragraph';
}

export interface CorrelationCondition {
  /** Triggered when a specific term set is chosen */
  chosenTermSet?: string;
  /** Triggered when a term with specific tag is chosen */
  chosenTag?: string;
  /** Triggered when a specific term value is chosen */
  chosenValue?: string;
  /** Triggered when a pattern is used */
  usedPattern?: string;
}

export interface CorrelationBoost {
  /** Term set to boost */
  termSet?: string;
  /** Pattern to boost */
  pattern?: string;
  /** Weight adjustment (can be negative) */
  weightDelta: number;
}

/** Constraint - Hard or soft rules */
export interface Constraint {
  /** Unique constraint ID */
  id: string;
  /** Constraint enforcement level */
  level: 'hard' | 'soft';
  /** Scope of the constraint */
  scope: 'token' | 'phrase' | 'clause' | 'sentence' | 'paragraph' | 'text';
  /** Type of constraint */
  type: 'noRepeat' | 'maxCount' | 'minCount' | 'required' | 'forbidden' | 'custom';
  /** Target of the constraint (e.g., "pos:noun", "PP", "termSet:noun.tech") */
  target: string;
  /** Value for count-based constraints */
  value?: number;
  /** Custom constraint function name (for type: 'custom') */
  customFn?: string;
}

/** Invariant - Must always be true */
export interface Invariant {
  /** Unique invariant ID */
  id: string;
  /** Type of invariant */
  type: 'capitalization' | 'punctuation' | 'whitespace' | 'agreement' | 'custom';
  /** Scope of the invariant */
  scope: 'token' | 'phrase' | 'clause' | 'sentence' | 'paragraph' | 'text';
  /** Custom invariant function name */
  customFn?: string;
}

/** Archetype - Style preset with biases */
export interface Archetype {
  /** Tags that apply when this archetype is active */
  tags?: string[];
  /** Distribution overrides */
  distributions?: {
    sentenceTypes?: string;
    termSetBias?: string;
    [key: string]: string | undefined;
  };
  /** Config overrides */
  overrides?: {
    interjectionRate?: number;
    subordinateClauseRate?: number;
    relativeClauseRate?: number;
    questionRate?: number;
    compoundRate?: number;
    maxPPChain?: number;
    avgSentenceLength?: number;
    [key: string]: number | undefined;
  };
  /** Output transform overrides for this archetype */
  outputTransforms?: ArchetypeOutputTransforms;
}

/** Relation - Connects terms/entities */
export interface Relation {
  /** Source term */
  from: string;
  /** Relation type */
  type: string;
  /** Target term */
  to: string;
  /** Relation weight for sampling */
  weight?: number;
}

/** Query for sampling terms */
export interface TermQuery {
  /** Required part of speech */
  pos: POS;
  /** Filter by tags */
  tags?: string[];
  /** Explicit term set IDs to sample from */
  termSetIds?: string[];
  /** Required features */
  features?: Partial<TermFeatures>;
  /** Whether to fallback to Faker if no lexicon match */
  fallbackToFaker: boolean;
  /** Exclude these values */
  exclude?: string[];
}

/** Query for sampling patterns */
export interface PatternQuery {
  /** Pattern type */
  type: Pattern['type'];
  /** Filter by tags */
  tags?: string[];
  /** Explicit pattern IDs */
  patternIds?: string[];
}

/** Event recorded when a choice is made */
export interface ChoiceEvent {
  /** Type of choice */
  type: 'term' | 'pattern' | 'template';
  /** The chosen item */
  item: LexicalItem | Pattern | string;
  /** Term set ID if applicable */
  termSetId?: string;
  /** Pattern ID if applicable */
  patternId?: string;
  /** Current scope */
  scope: 'token' | 'phrase' | 'sentence' | 'paragraph';
}

/** Result from evaluating relations */
export interface RelationResult {
  /** Related term */
  term: string;
  /** Relation type */
  relationType: string;
  /** Relation weight */
  weight: number;
  /** Direction of relation */
  direction: 'outgoing' | 'incoming';
}
