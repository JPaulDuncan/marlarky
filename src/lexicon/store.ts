/**
 * Lexicon Store Implementation
 * Provides access to lexicon data and sampling utilities
 */

import type { ILexiconStore } from '../interfaces/lexicon-store.js';
import type { IRng } from '../interfaces/rng.js';
import type { GenerationContext } from '../types/context.js';
import type {
  Lexicon,
  TermSet,
  Pattern,
  LexicalItem,
  TermQuery,
  PatternQuery,
  ChoiceEvent,
  RelationResult,
  Archetype,
  DistributionEntry,
  POS,
} from '../types/lexicon.js';

export class LexiconStore implements ILexiconStore {
  private lexicon: Lexicon | null = null;
  private rng: IRng;

  constructor(rng: IRng, lexicon?: Lexicon) {
    this.rng = rng;
    if (lexicon) {
      this.lexicon = lexicon;
    }
  }

  setLexicon(lexicon: Lexicon): void {
    this.lexicon = lexicon;
  }

  isLoaded(): boolean {
    return this.lexicon !== null;
  }

  getMeta(): { id: string; version?: string; language: string } | undefined {
    if (!this.lexicon) return undefined;
    return {
      id: this.lexicon.id,
      version: this.lexicon.version,
      language: this.lexicon.language,
    };
  }

  getTermSet(id: string): TermSet | undefined {
    return this.lexicon?.termSets?.[id];
  }

  getTermSetIds(): string[] {
    if (!this.lexicon?.termSets) return [];
    return Object.keys(this.lexicon.termSets);
  }

  sampleTerm(termQuery: TermQuery, ctx: GenerationContext): LexicalItem | undefined {
    if (!this.lexicon?.termSets) return undefined;

    // Find matching term sets
    const candidateSets = this.findMatchingTermSets(termQuery, ctx);
    if (candidateSets.length === 0) return undefined;

    // Weight the term sets based on distributions and biases
    const weightedSets = candidateSets.map(({ id, set }) => {
      let weight = 1;

      // Apply distribution weights from archetype
      const archetype = this.getArchetype(ctx.archetype);
      if (archetype?.distributions?.termSetBias) {
        const dist = this.getDistribution(archetype.distributions.termSetBias);
        const entry = dist?.find(e => e.key === id);
        if (entry) {
          weight *= entry.weight;
        }
      }

      // Apply context biases
      const bias = ctx.biases.get(id) ?? 0;
      weight += bias;

      return { item: { id, set }, weight: Math.max(0, weight) };
    });

    // Sample a term set
    const validWeightedSets = weightedSets.filter(w => w.weight > 0);
    if (validWeightedSets.length === 0) return undefined;

    const { id: termSetId, set } = this.rng.weightedPick(validWeightedSets);

    // Filter terms by features and exclusions
    let terms = set.terms.filter(t => {
      // Check features match
      if (termQuery.features) {
        for (const [key, value] of Object.entries(termQuery.features)) {
          if (t.features?.[key] !== value) {
            return false;
          }
        }
      }

      // Check exclusions
      if (termQuery.exclude?.includes(t.value)) {
        return false;
      }

      return true;
    });

    if (terms.length === 0) return undefined;

    // Weight and sample a term
    const weightedTerms = terms.map(t => ({
      item: t,
      weight: t.weight ?? 1,
    }));

    const term = this.rng.weightedPick(weightedTerms);

    return {
      value: term.value,
      pos: termQuery.pos,
      termSetId,
      features: term.features,
      tags: term.tags ?? set.tags,
    };
  }

  private findMatchingTermSets(termQuery: TermQuery, ctx: GenerationContext): Array<{ id: string; set: TermSet }> {
    if (!this.lexicon?.termSets) return [];

    const results: Array<{ id: string; set: TermSet }> = [];

    // If explicit IDs provided, use only those
    if (termQuery.termSetIds && termQuery.termSetIds.length > 0) {
      for (const id of termQuery.termSetIds) {
        const set = this.lexicon.termSets[id];
        if (set && set.pos === termQuery.pos) {
          results.push({ id, set });
        }
      }
      return results;
    }

    // Otherwise find by POS and tags
    for (const [id, set] of Object.entries(this.lexicon.termSets)) {
      // Must match POS
      if (set.pos !== termQuery.pos) continue;

      // Check tags
      if (termQuery.tags && termQuery.tags.length > 0) {
        const setTags = new Set(set.tags ?? []);
        const hasMatchingTag = termQuery.tags.some(t => setTags.has(t));
        if (!hasMatchingTag) continue;
      }

      // Check context active tags
      if (ctx.activeTags.size > 0 && set.tags) {
        const setTags = new Set(set.tags);
        const hasActiveTag = [...ctx.activeTags].some(t => setTags.has(t));
        // Boost sets that match active tags (but don't exclude non-matching)
        if (!hasActiveTag && termQuery.tags && termQuery.tags.length > 0) {
          continue; // Only exclude if specific tags were requested
        }
      }

      results.push({ id, set });
    }

    return results;
  }

  getPattern(id: string): Pattern | undefined {
    return this.lexicon?.patterns?.[id];
  }

  getPatternIds(): string[] {
    if (!this.lexicon?.patterns) return [];
    return Object.keys(this.lexicon.patterns);
  }

  samplePattern(patternQuery: PatternQuery, ctx: GenerationContext): Pattern | undefined {
    if (!this.lexicon?.patterns) return undefined;

    // Find matching patterns
    const candidates: Array<{ id: string; pattern: Pattern }> = [];

    // If explicit IDs provided
    if (patternQuery.patternIds && patternQuery.patternIds.length > 0) {
      for (const id of patternQuery.patternIds) {
        const pattern = this.lexicon.patterns[id];
        if (pattern && pattern.type === patternQuery.type) {
          candidates.push({ id, pattern });
        }
      }
    } else {
      // Find by type and tags
      for (const [id, pattern] of Object.entries(this.lexicon.patterns)) {
        if (pattern.type !== patternQuery.type) continue;

        if (patternQuery.tags && patternQuery.tags.length > 0) {
          const patternTags = new Set(pattern.tags ?? []);
          const hasTag = patternQuery.tags.some(t => patternTags.has(t));
          if (!hasTag) continue;
        }

        candidates.push({ id, pattern });
      }
    }

    if (candidates.length === 0) return undefined;

    // Weight patterns
    const weighted = candidates.map(({ id, pattern }) => {
      let weight = pattern.weight ?? 1;

      // Apply context biases
      const bias = ctx.biases.get(`pattern:${id}`) ?? 0;
      weight += bias;

      return { item: pattern, weight: Math.max(0, weight) };
    });

    const validWeighted = weighted.filter(w => w.weight > 0);
    if (validWeighted.length === 0) return undefined;

    return this.rng.weightedPick(validWeighted);
  }

  applyCorrelations(ctx: GenerationContext, chosen: ChoiceEvent): void {
    if (!this.lexicon?.correlations) return;

    for (const correlation of this.lexicon.correlations) {
      // Check if condition matches
      if (!this.matchesCorrelationCondition(correlation.when, chosen)) {
        continue;
      }

      // Apply boosts
      for (const boost of correlation.thenBoost) {
        const scope = correlation.scope;
        const prefix = `${scope}:`;

        if (boost.termSet) {
          const key = prefix + boost.termSet;
          const current = ctx.biases.get(key) ?? 0;
          ctx.biases.set(key, current + boost.weightDelta);

          // Also set without prefix for simpler lookup
          const currentSimple = ctx.biases.get(boost.termSet) ?? 0;
          ctx.biases.set(boost.termSet, currentSimple + boost.weightDelta);
        }

        if (boost.pattern) {
          const key = prefix + `pattern:${boost.pattern}`;
          const current = ctx.biases.get(key) ?? 0;
          ctx.biases.set(key, current + boost.weightDelta);
        }
      }
    }
  }

  private matchesCorrelationCondition(condition: { chosenTermSet?: string; chosenTag?: string; chosenValue?: string; usedPattern?: string }, chosen: ChoiceEvent): boolean {
    if (condition.chosenTermSet && chosen.termSetId === condition.chosenTermSet) {
      return true;
    }

    if (condition.chosenTag && chosen.type === 'term') {
      const item = chosen.item as LexicalItem;
      if (item.tags?.includes(condition.chosenTag)) {
        return true;
      }
    }

    if (condition.chosenValue && chosen.type === 'term') {
      const item = chosen.item as LexicalItem;
      if (item.value === condition.chosenValue) {
        return true;
      }
    }

    if (condition.usedPattern && chosen.patternId === condition.usedPattern) {
      return true;
    }

    return false;
  }

  evaluateRelations(entityOrTerm: string, relationType?: string): RelationResult[] {
    if (!this.lexicon?.relations) return [];

    const results: RelationResult[] = [];

    for (const relation of this.lexicon.relations) {
      // Check outgoing relations
      if (relation.from === entityOrTerm) {
        if (!relationType || relation.type === relationType) {
          results.push({
            term: relation.to,
            relationType: relation.type,
            weight: relation.weight ?? 1,
            direction: 'outgoing',
          });
        }
      }

      // Check incoming relations
      if (relation.to === entityOrTerm) {
        if (!relationType || relation.type === relationType) {
          results.push({
            term: relation.from,
            relationType: relation.type,
            weight: relation.weight ?? 1,
            direction: 'incoming',
          });
        }
      }
    }

    return results;
  }

  getArchetype(name: string): Archetype | undefined {
    return this.lexicon?.archetypes?.[name];
  }

  getArchetypeNames(): string[] {
    if (!this.lexicon?.archetypes) return [];
    return Object.keys(this.lexicon.archetypes);
  }

  getDistribution(id: string): DistributionEntry[] | undefined {
    return this.lexicon?.distributions?.[id];
  }

  /** Get all term sets matching a POS */
  getTermSetsByPOS(pos: POS): Array<{ id: string; set: TermSet }> {
    if (!this.lexicon?.termSets) return [];

    const results: Array<{ id: string; set: TermSet }> = [];
    for (const [id, set] of Object.entries(this.lexicon.termSets)) {
      if (set.pos === pos) {
        results.push({ id, set });
      }
    }
    return results;
  }
}
