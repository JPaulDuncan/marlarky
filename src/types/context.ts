/**
 * Generation Context Types
 * Based on TDD Section 7 - Generation Context
 */

import type { Constraint, Invariant, ChoiceEvent, LexicalItem, POS } from './lexicon.js';

/** Phrase features for agreement */
export interface PhraseFeatures {
  /** Grammatical number */
  number: 'singular' | 'plural';
  /** Grammatical person */
  person: 1 | 2 | 3;
}

/** History of choices made during generation */
export interface GenerationHistory {
  /** Term sets that have been used */
  chosenTermSets: string[];
  /** Terms chosen by POS */
  chosenTerms: Map<POS, LexicalItem[]>;
  /** Patterns/templates used */
  chosenPatterns: string[];
  /** All choice events */
  events: ChoiceEvent[];
}

/** Scope stack entry */
export interface ScopeEntry {
  type: 'token' | 'phrase' | 'clause' | 'sentence' | 'paragraph' | 'text';
  startIndex: number;
}

/** Generation Context - Tracks state and biases during generation */
export interface GenerationContext {
  /** Current seed value */
  seed: number;
  /** Active archetype name */
  archetype: string;
  /** Active tags (e.g., domain:tech) */
  activeTags: Set<string>;
  /** Bias adjustments for term sets and patterns */
  biases: Map<string, number>;
  /** History of choices made */
  history: GenerationHistory;
  /** Current scope stack */
  scopeStack: ScopeEntry[];
  /** Active constraints */
  constraints: Constraint[];
  /** Active invariants */
  invariants: Invariant[];
  /** Current sentence index in paragraph */
  sentenceIndex: number;
  /** Current paragraph index in text */
  paragraphIndex: number;
  /** Tokens generated in current sentence */
  currentSentenceTokens: string[];
  /** Subject features for agreement */
  currentSubjectFeatures?: PhraseFeatures;
  /** Relation hints from previous choices */
  relationHints: string[];
  /** Retry count for current unit */
  retryCount: number;
}

/** Create a fresh generation context */
export function createContext(seed: number, archetype: string = 'default'): GenerationContext {
  return {
    seed,
    archetype,
    activeTags: new Set(),
    biases: new Map(),
    history: {
      chosenTermSets: [],
      chosenTerms: new Map(),
      chosenPatterns: [],
      events: [],
    },
    scopeStack: [{ type: 'text', startIndex: 0 }],
    constraints: [],
    invariants: [],
    sentenceIndex: 0,
    paragraphIndex: 0,
    currentSentenceTokens: [],
    currentSubjectFeatures: undefined,
    relationHints: [],
    retryCount: 0,
  };
}

/** Push a new scope onto the stack */
export function pushScope(ctx: GenerationContext, type: ScopeEntry['type']): void {
  ctx.scopeStack.push({ type, startIndex: ctx.history.events.length });
}

/** Pop the current scope from the stack */
export function popScope(ctx: GenerationContext): ScopeEntry | undefined {
  if (ctx.scopeStack.length > 1) {
    return ctx.scopeStack.pop();
  }
  return undefined;
}

/** Get the current scope */
export function currentScope(ctx: GenerationContext): ScopeEntry['type'] {
  return ctx.scopeStack[ctx.scopeStack.length - 1]?.type ?? 'text';
}

/** Record a choice event */
export function recordChoice(ctx: GenerationContext, event: ChoiceEvent): void {
  ctx.history.events.push(event);

  if (event.type === 'term' && typeof event.item === 'object' && event.item !== null && 'pos' in event.item) {
    const item = event.item as LexicalItem;
    const existing = ctx.history.chosenTerms.get(item.pos) ?? [];
    existing.push(item);
    ctx.history.chosenTerms.set(item.pos, existing);

    if (event.termSetId) {
      ctx.history.chosenTermSets.push(event.termSetId);
    }
  } else if (event.type === 'pattern' && event.patternId) {
    ctx.history.chosenPatterns.push(event.patternId);
  }
}

/** Clear sentence-level state */
export function clearSentenceState(ctx: GenerationContext): void {
  ctx.currentSentenceTokens = [];
  ctx.currentSubjectFeatures = undefined;
  ctx.relationHints = [];

  // Clear sentence-scoped biases
  for (const [key, _value] of ctx.biases) {
    if (key.startsWith('sentence:')) {
      ctx.biases.delete(key);
    }
  }
}

/** Clear paragraph-level state */
export function clearParagraphState(ctx: GenerationContext): void {
  clearSentenceState(ctx);
  ctx.sentenceIndex = 0;

  // Clear paragraph-scoped biases
  for (const [key, _value] of ctx.biases) {
    if (key.startsWith('paragraph:')) {
      ctx.biases.delete(key);
    }
  }
}
