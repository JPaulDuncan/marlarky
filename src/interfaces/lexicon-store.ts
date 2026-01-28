import type { GenerationContext } from '../types/context.js';
import type {
  TermSet,
  Pattern,
  LexicalItem,
  TermQuery,
  PatternQuery,
  ChoiceEvent,
  RelationResult,
} from '../types/lexicon.js';

/**
 * Lexicon Store Interface
 * Provides access to lexicon data and sampling utilities
 */
export interface ILexiconStore {
  /** Get a term set by ID */
  getTermSet(id: string): TermSet | undefined;

  /** Get all term set IDs */
  getTermSetIds(): string[];

  /** Sample a term from the lexicon based on query and context */
  sampleTerm(termQuery: TermQuery, ctx: GenerationContext): LexicalItem | undefined;

  /** Get a pattern by ID */
  getPattern(id: string): Pattern | undefined;

  /** Get all pattern IDs */
  getPatternIds(): string[];

  /** Sample a pattern based on query and context */
  samplePattern(patternQuery: PatternQuery, ctx: GenerationContext): Pattern | undefined;

  /** Apply correlations after a choice event */
  applyCorrelations(ctx: GenerationContext, chosen: ChoiceEvent): void;

  /** Evaluate relations for an entity or term */
  evaluateRelations(entityOrTerm: string, relationType?: string): RelationResult[];

  /** Get archetype by name */
  getArchetype(name: string): import('../types/lexicon.js').Archetype | undefined;

  /** Get all archetype names */
  getArchetypeNames(): string[];

  /** Get distribution by ID */
  getDistribution(id: string): import('../types/lexicon.js').DistributionEntry[] | undefined;

  /** Check if lexicon is loaded */
  isLoaded(): boolean;

  /** Get lexicon metadata */
  getMeta(): { id: string; version?: string; language: string } | undefined;
}
