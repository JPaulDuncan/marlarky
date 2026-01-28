/**
 * Output Transform System Types
 * Based on TDD-LSETG-OT-001
 */

import type { IRng } from '../interfaces/rng.js';

// ─── Token Model ───────────────────────────────────────────────

/** Token type classification */
export type TokenType = 'word' | 'whitespace' | 'punct' | 'number' | 'symbol';

/** A single token from tokenization */
export interface Token {
  /** Token type */
  type: TokenType;
  /** Token value (exact text) */
  value: string;
  /** Token metadata */
  meta?: TokenMeta;
}

/** Metadata attached to a token */
export interface TokenMeta {
  /** Whether this token is protected from transforms */
  protected?: boolean;
  /** Which protection rules matched */
  protectionsApplied?: string[];
}

// ─── Protection Configuration ──────────────────────────────────

/** Protection rule configuration */
export interface ProtectionConfig {
  /** Keep ALL-CAPS acronyms unchanged */
  keepAcronyms?: boolean;
  /** Keep number tokens unchanged */
  keepNumbers?: boolean;
  /** Keep code-like tokens unchanged */
  keepCodeTokens?: boolean;
  /** Keep URL/email-like tokens unchanged */
  keepUrlsEmails?: boolean;
  /** Minimum word length to transform (shorter words are protected) */
  minWordLength?: number;
  /** Custom regex patterns for additional protection */
  customProtectedRegex?: string[];
}

/** Default protection config */
export const DEFAULT_PROTECTION_CONFIG: Required<ProtectionConfig> = {
  keepAcronyms: true,
  keepNumbers: true,
  keepCodeTokens: true,
  keepUrlsEmails: true,
  minWordLength: 2,
  customProtectedRegex: [],
};

// ─── Transform Step & Config ───────────────────────────────────

/** A single step in the transform pipeline */
export interface TransformStep {
  /** Transform ID (must match registered transform) */
  id: string;
  /** Transform-specific parameters */
  params?: Record<string, unknown>;
}

/** Output transforms configuration */
export interface OutputTransformsConfig {
  /** Whether output transforms are enabled */
  enabled: boolean;
  /** Ordered list of transform steps */
  pipeline: TransformStep[];
  /** Token protection configuration */
  protection: ProtectionConfig;
  /** If true, unknown transform ID or invalid params throws; else skip with warning */
  strict: boolean;
  /** Whether to auto-reorder pipeline by preferredOrder */
  autoOrder?: boolean;
}

/** Default output transforms config (disabled) */
export const DEFAULT_OUTPUT_TRANSFORMS_CONFIG: OutputTransformsConfig = {
  enabled: false,
  pipeline: [],
  protection: { ...DEFAULT_PROTECTION_CONFIG },
  strict: false,
  autoOrder: false,
};

/** Per-call override for output transforms */
export interface OutputTransformsOverride {
  /** Partial config override */
  outputTransforms?: Partial<OutputTransformsConfig>;
  /** How to merge pipeline with base config */
  mergeMode?: 'replace' | 'append';
}

// ─── Transform Plugin Interfaces ───────────────────────────────

/** Capabilities declared by a transform */
export interface TransformCapabilities {
  /** Whether the transform requires trace data */
  requiresTrace: boolean;
  /** Whether the transform is POS-aware */
  posAware: boolean;
  /** Whether the transform produces deterministic output (must be true for built-ins) */
  deterministic: boolean;
  /** Whether safe to stack with other transforms */
  safeToStack: boolean;
  /** Suggested ordering priority (lower = earlier in pipeline) */
  preferredOrder?: number;
}

/** Input provided to a transform */
export interface TransformInput {
  /** Tokenized text */
  tokens: Token[];
  /** Transform-specific parameters */
  params: Record<string, unknown>;
  /** Seeded RNG scoped to this transform step */
  rng: IRng;
  /** Protection configuration */
  protection: ProtectionConfig;
  /** Whether tracing is enabled */
  traceEnabled: boolean;
}

/** Output returned from a transform */
export interface TransformOutput {
  /** Transformed tokens */
  tokens: Token[];
  /** Transform events for tracing */
  events?: TransformEvent[];
  /** Warnings generated during transform */
  warnings?: string[];
}

/** Validation result for transform params */
export interface ValidationResult {
  /** Whether params are valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
}

/** Transform plugin interface */
export interface IOutputTransform {
  /** Unique transform ID */
  id: string;
  /** Transform version */
  version: string;
  /** Declared capabilities */
  capabilities: TransformCapabilities;
  /** Validate parameters */
  validateParams(params: unknown): ValidationResult;
  /** Apply the transform */
  apply(input: TransformInput): TransformOutput;
}

// ─── Trace Types ───────────────────────────────────────────────

/** Trace for a single token through the transform pipeline */
export interface OutputTokenTrace {
  /** Token type */
  type: TokenType;
  /** Original token value (before transforms) */
  original: string;
  /** Transformed token value (after transforms) */
  transformed: string;
  /** Whether the token was protected */
  protected: boolean;
  /** Which protections matched */
  protectionsApplied?: string[];
}

/** Event recorded for a transform step */
export interface TransformEvent {
  /** Transform ID */
  transformId: string;
  /** Hash of parameters used */
  paramsHash: string;
  /** Number of tokens changed */
  tokensChangedCount: number;
  /** Warnings from this step */
  warnings?: string[];
}

// ─── Lexicon Integration Types ─────────────────────────────────

/** Output transforms config that can appear in a Lexicon */
export interface LexiconOutputTransforms {
  /** Default transforms for this lexicon */
  defaults?: TransformStep[];
}

/** Output transforms config for an archetype */
export interface ArchetypeOutputTransforms {
  /** Pipeline for this archetype */
  pipeline?: TransformStep[];
}
