/**
 * Lexicon-Aware Word Provider
 * Samples words from lexicon with Faker fallback
 */

import type { IFakerAdapter } from '../interfaces/faker-adapter.js';
import type { IRng } from '../interfaces/rng.js';
import type { LexiconStore } from '../lexicon/store.js';
import type { GenerationContext } from '../types/context.js';
import type { LexicalItem, POS, TermQuery } from '../types/lexicon.js';
import { recordChoice } from '../types/context.js';
import * as defaults from '../defaults/index.js';

export class WordProvider {
  private lexiconStore: LexiconStore;
  private fakerAdapter: IFakerAdapter;
  private rng: IRng;

  constructor(lexiconStore: LexiconStore, fakerAdapter: IFakerAdapter, rng: IRng) {
    this.lexiconStore = lexiconStore;
    this.fakerAdapter = fakerAdapter;
    this.rng = rng;
  }

  /**
   * Get a word by POS with lexicon sampling and faker fallback
   */
  getWord(
    pos: POS,
    ctx: GenerationContext,
    options: {
      tags?: string[];
      termSetIds?: string[];
      features?: Record<string, unknown>;
      exclude?: string[];
      fallbackToFaker?: boolean;
    } = {}
  ): LexicalItem {
    const { tags, termSetIds, features, exclude, fallbackToFaker = true } = options;

    // Try lexicon first
    const query: TermQuery = {
      pos,
      tags,
      termSetIds,
      features: features as TermQuery['features'],
      exclude,
      fallbackToFaker,
    };

    const lexiconItem = this.lexiconStore.sampleTerm(query, ctx);

    if (lexiconItem) {
      // Record the choice for correlations
      recordChoice(ctx, {
        type: 'term',
        item: lexiconItem,
        termSetId: lexiconItem.termSetId,
        scope: 'token',
      });

      // Apply correlations
      this.lexiconStore.applyCorrelations(ctx, {
        type: 'term',
        item: lexiconItem,
        termSetId: lexiconItem.termSetId,
        scope: 'token',
      });

      // Add relation hints
      if (lexiconItem.value) {
        const relations = this.lexiconStore.evaluateRelations(lexiconItem.value);
        for (const rel of relations) {
          ctx.relationHints.push(rel.term);
        }
      }

      return lexiconItem;
    }

    // Fallback to default lists or faker
    if (fallbackToFaker) {
      const value = this.getFallbackWord(pos, exclude);
      const item: LexicalItem = {
        value,
        pos,
        tags: [],
      };

      recordChoice(ctx, {
        type: 'term',
        item,
        scope: 'token',
      });

      return item;
    }

    // If no fallback, throw
    throw new Error(`No term found for POS: ${pos}`);
  }

  /**
   * Get a fallback word from default lists or faker
   */
  private getFallbackWord(pos: POS, exclude?: string[]): string {
    let candidates: string[];

    switch (pos) {
      case 'noun':
        candidates = defaults.DEFAULT_NOUNS;
        break;
      case 'verb':
        candidates = defaults.DEFAULT_VERBS;
        break;
      case 'adj':
        candidates = defaults.DEFAULT_ADJECTIVES;
        break;
      case 'adv':
        candidates = defaults.DEFAULT_ADVERBS;
        break;
      case 'prep':
        candidates = defaults.DEFAULT_PREPOSITIONS;
        break;
      case 'conj':
        candidates = defaults.DEFAULT_CONJUNCTIONS;
        break;
      case 'intj':
        candidates = defaults.DEFAULT_INTERJECTIONS;
        break;
      case 'det':
        candidates = defaults.DEFAULT_DETERMINERS;
        break;
      default:
        candidates = [];
    }

    // Filter exclusions
    if (exclude && exclude.length > 0) {
      const excludeSet = new Set(exclude);
      candidates = candidates.filter(w => !excludeSet.has(w));
    }

    // If we have candidates, pick from them
    if (candidates.length > 0) {
      return this.rng.pick(candidates);
    }

    // Otherwise use faker
    return this.getFromFaker(pos);
  }

  /**
   * Get a word directly from faker
   */
  private getFromFaker(pos: POS): string {
    switch (pos) {
      case 'noun':
        return this.fakerAdapter.noun();
      case 'verb':
        return this.fakerAdapter.verb();
      case 'adj':
        return this.fakerAdapter.adjective();
      case 'adv':
        return this.fakerAdapter.adverb();
      case 'prep':
        return this.fakerAdapter.preposition();
      case 'conj':
        return this.fakerAdapter.conjunction();
      case 'intj':
        return this.fakerAdapter.interjection();
      case 'det':
        return this.rng.pick(defaults.DEFAULT_DETERMINERS);
      default:
        return this.fakerAdapter.noun();
    }
  }

  /**
   * Get a noun
   */
  getNoun(ctx: GenerationContext, options?: { tags?: string[]; exclude?: string[] }): LexicalItem {
    return this.getWord('noun', ctx, options);
  }

  /**
   * Get a verb
   */
  getVerb(ctx: GenerationContext, options?: { tags?: string[]; exclude?: string[] }): LexicalItem {
    return this.getWord('verb', ctx, options);
  }

  /**
   * Get an adjective
   */
  getAdjective(ctx: GenerationContext, options?: { tags?: string[]; exclude?: string[] }): LexicalItem {
    return this.getWord('adj', ctx, options);
  }

  /**
   * Get an adverb
   */
  getAdverb(ctx: GenerationContext, options?: { tags?: string[]; exclude?: string[] }): LexicalItem {
    return this.getWord('adv', ctx, options);
  }

  /**
   * Get a preposition
   */
  getPreposition(ctx: GenerationContext, options?: { tags?: string[]; exclude?: string[] }): LexicalItem {
    return this.getWord('prep', ctx, options);
  }

  /**
   * Get a conjunction
   */
  getConjunction(ctx: GenerationContext, options?: { tags?: string[]; exclude?: string[] }): LexicalItem {
    return this.getWord('conj', ctx, options);
  }

  /**
   * Get an interjection
   */
  getInterjection(ctx: GenerationContext, options?: { tags?: string[]; exclude?: string[] }): LexicalItem {
    return this.getWord('intj', ctx, options);
  }

  /**
   * Get a determiner
   */
  getDeterminer(ctx: GenerationContext, options?: { exclude?: string[] }): string {
    const item = this.getWord('det', ctx, options);
    return item.value;
  }

  /**
   * Get a subject pronoun
   */
  getSubjectPronoun(): string {
    return this.rng.pick(defaults.DEFAULT_SUBJECT_PRONOUNS);
  }

  /**
   * Get an object pronoun
   */
  getObjectPronoun(): string {
    return this.rng.pick(defaults.DEFAULT_OBJECT_PRONOUNS);
  }

  /**
   * Get a possessive determiner
   */
  getPossessiveDeterminer(): string {
    return this.rng.pick(defaults.DEFAULT_POSSESSIVE_DETERMINERS);
  }

  /**
   * Get a modal verb
   */
  getModal(): string {
    return this.rng.pick(defaults.DEFAULT_MODALS);
  }

  /**
   * Get a subordinating conjunction
   */
  getSubordinator(): string {
    return this.rng.pick(defaults.DEFAULT_SUBORDINATORS);
  }

  /**
   * Get a relative pronoun
   */
  getRelativePronoun(): string {
    return this.rng.pick(defaults.DEFAULT_RELATIVES);
  }

  /**
   * Get a coordinating conjunction
   */
  getCoordinator(): string {
    return this.rng.pick(defaults.DEFAULT_CONJUNCTIONS);
  }

  /**
   * Get a transition word/phrase
   */
  getTransition(): string {
    return this.rng.pick(defaults.DEFAULT_TRANSITIONS);
  }

  /**
   * Get related terms based on current context
   */
  getRelatedNoun(ctx: GenerationContext): LexicalItem | undefined {
    if (ctx.relationHints.length === 0) return undefined;

    // Try to find a term set containing one of the hinted terms
    for (const hint of ctx.relationHints) {
      const query: TermQuery = {
        pos: 'noun',
        fallbackToFaker: false,
      };

      // Look for term sets containing this hint
      const termSets = this.lexiconStore.getTermSetsByPOS('noun');
      for (const { id, set } of termSets) {
        if (set.terms.some(t => t.value === hint)) {
          query.termSetIds = [id];
          const item = this.lexiconStore.sampleTerm(query, ctx);
          if (item) return item;
        }
      }
    }

    return undefined;
  }
}
