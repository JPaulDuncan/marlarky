/**
 * Phrase Builders
 * Builds NP, VP, PP, ADJP, ADVP phrases
 */

import type { IRng } from '../interfaces/rng.js';
import type { GeneratorConfig } from '../types/config.js';
import type { GenerationContext, PhraseFeatures } from '../types/context.js';
import { WordProvider } from '../providers/word-provider.js';
import {
  getIndefiniteArticle,
  pluralize,
  getThirdPersonSingular,
  getPastTense,
  getPresentParticiple,
  conjugateBe,
} from '../morphology/index.js';

export interface PhraseResult {
  tokens: string[];
  features?: PhraseFeatures;
}

export class PhraseBuilders {
  private wordProvider: WordProvider;
  private rng: IRng;
  private config: GeneratorConfig;

  constructor(wordProvider: WordProvider, rng: IRng, config: GeneratorConfig) {
    this.wordProvider = wordProvider;
    this.rng = rng;
    this.config = config;
  }

  /**
   * Build a Noun Phrase (NP)
   * Structure: [DET] [ADJP?] NOUN [PP*]
   */
  buildNP(ctx: GenerationContext, options: {
    usePronoun?: boolean;
    useProperNoun?: boolean;
    includePP?: boolean;
    maxPP?: number;
    forcePlural?: boolean;
    forceSingular?: boolean;
    useDeterminer?: boolean;
  } = {}): PhraseResult {
    const {
      usePronoun = false,
      includePP = false,
      maxPP = this.config.maxPPChain,
      forcePlural = false,
      forceSingular = false,
      useDeterminer = true,
    } = options;

    const tokens: string[] = [];
    let features: PhraseFeatures = { number: 'singular', person: 3 };

    // Option 1: Use a pronoun
    if (usePronoun && this.rng.chance(0.3)) {
      const pronoun = this.wordProvider.getSubjectPronoun();
      tokens.push(pronoun);

      // Set features based on pronoun
      if (pronoun === 'I') {
        features = { number: 'singular', person: 1 };
      } else if (pronoun === 'you') {
        features = { number: 'singular', person: 2 }; // Can be plural too
      } else if (pronoun === 'we') {
        features = { number: 'plural', person: 1 };
      } else if (pronoun === 'they') {
        features = { number: 'plural', person: 3 };
      } else if (['he', 'she', 'it'].includes(pronoun)) {
        features = { number: 'singular', person: 3 };
      }

      return { tokens, features };
    }

    // Get the noun first
    const nounItem = this.wordProvider.getNoun(ctx);
    let noun = nounItem.value;

    // Determine number
    const isPlural = forcePlural || (!forceSingular && this.rng.chance(0.25));
    if (isPlural) {
      noun = pluralize(noun);
      features.number = 'plural';
    }

    // Add determiner
    if (useDeterminer) {
      if (isPlural) {
        // Plural determiners: the, some, many, few, these, those
        const pluralDets = ['the', 'some', 'many', 'few', 'these', 'those', 'several'];
        tokens.push(this.rng.pick(pluralDets));
      } else {
        // Singular determiners: the, a/an, this, that
        if (this.rng.chance(0.5)) {
          tokens.push('the');
        } else {
          // Use a/an - need to know what follows
          const willHaveAdj = this.rng.chance(0.4) && this.config.maxAdjectivesPerNoun > 0;
          if (willHaveAdj) {
            // Defer article until we have adjective
          } else {
            tokens.push(getIndefiniteArticle(noun));
          }
        }
      }
    }

    // Optionally add adjective(s)
    const numAdjectives = this.rng.chance(0.4)
      ? this.rng.int(1, this.config.maxAdjectivesPerNoun)
      : 0;

    const adjectives: string[] = [];
    for (let i = 0; i < numAdjectives; i++) {
      const adjItem = this.wordProvider.getAdjective(ctx);
      adjectives.push(adjItem.value);
    }

    // If we have adjectives and need article, add it now
    if (adjectives.length > 0 && useDeterminer && !isPlural && tokens.length === 0) {
      tokens.push(getIndefiniteArticle(adjectives[0]!));
    }

    tokens.push(...adjectives);
    tokens.push(noun);

    // Optionally add PP(s)
    if (includePP && this.rng.chance(0.3)) {
      const numPPs = this.rng.int(1, maxPP);
      for (let i = 0; i < numPPs; i++) {
        const pp = this.buildPP(ctx);
        tokens.push(...pp.tokens);
      }
    }

    return { tokens, features };
  }

  /**
   * Build a Verb Phrase (VP)
   * Structure: [ADVP?] VERB [NP?] [PP?] [ADVP?]
   */
  buildVP(ctx: GenerationContext, subjectFeatures: PhraseFeatures, options: {
    includeObject?: boolean;
    includePP?: boolean;
    tense?: 'present' | 'past' | 'progressive';
    useModal?: boolean;
  } = {}): PhraseResult {
    const {
      includeObject = true,
      includePP = false,
      tense = 'present',
      useModal = false,
    } = options;

    const tokens: string[] = [];

    // Optionally add leading adverb
    if (this.rng.chance(0.2)) {
      const advItem = this.wordProvider.getAdverb(ctx);
      tokens.push(advItem.value);
    }

    // Get the verb
    const verbItem = this.wordProvider.getVerb(ctx);
    let verb = verbItem.value;

    // Add modal if requested
    if (useModal && this.rng.chance(0.3)) {
      tokens.push(this.wordProvider.getModal());
      // Modal takes base form
    } else {
      // Conjugate based on tense and subject
      if (tense === 'past') {
        verb = getPastTense(verb);
      } else if (tense === 'progressive') {
        const beVerb = conjugateBe(subjectFeatures, 'present');
        tokens.push(beVerb);
        verb = getPresentParticiple(verb);
      } else if (tense === 'present' && subjectFeatures.number === 'singular' && subjectFeatures.person === 3) {
        verb = getThirdPersonSingular(verb);
      }
    }

    tokens.push(verb);

    // Optionally add object NP
    if (includeObject && this.rng.chance(0.6)) {
      const objectNP = this.buildNP(ctx, { includePP: false });
      tokens.push(...objectNP.tokens);
    }

    // Optionally add PP
    if (includePP && this.rng.chance(0.25)) {
      const pp = this.buildPP(ctx);
      tokens.push(...pp.tokens);
    }

    // Optionally add trailing adverb
    if (this.rng.chance(0.15)) {
      const advItem = this.wordProvider.getAdverb(ctx);
      tokens.push(advItem.value);
    }

    return { tokens };
  }

  /**
   * Build a Prepositional Phrase (PP)
   * Structure: PREP NP
   */
  buildPP(ctx: GenerationContext): PhraseResult {
    const tokens: string[] = [];

    const prepItem = this.wordProvider.getPreposition(ctx);
    tokens.push(prepItem.value);

    // NP after preposition (no nested PP to avoid recursion)
    const np = this.buildNP(ctx, { includePP: false });
    tokens.push(...np.tokens);

    return { tokens };
  }

  /**
   * Build an Adjective Phrase (ADJP)
   * Structure: [ADVP?] ADJ
   */
  buildADJP(ctx: GenerationContext): PhraseResult {
    const tokens: string[] = [];

    // Optionally add intensifying adverb
    if (this.rng.chance(0.3)) {
      const intensifiers = ['very', 'quite', 'rather', 'somewhat', 'extremely', 'incredibly'];
      tokens.push(this.rng.pick(intensifiers));
    }

    const adjItem = this.wordProvider.getAdjective(ctx);
    tokens.push(adjItem.value);

    return { tokens };
  }

  /**
   * Build an Adverb Phrase (ADVP)
   * Structure: [INTENSIFIER?] ADV
   */
  buildADVP(ctx: GenerationContext): PhraseResult {
    const tokens: string[] = [];

    // Optionally add intensifying adverb
    if (this.rng.chance(0.2)) {
      const intensifiers = ['very', 'quite', 'rather', 'most'];
      tokens.push(this.rng.pick(intensifiers));
    }

    const advItem = this.wordProvider.getAdverb(ctx);
    tokens.push(advItem.value);

    return { tokens };
  }

  /**
   * Build a clause (NP VP)
   */
  buildClause(ctx: GenerationContext, options: {
    tense?: 'present' | 'past' | 'progressive';
    usePronoun?: boolean;
  } = {}): PhraseResult {
    const { tense = 'present', usePronoun = false } = options;

    const subject = this.buildNP(ctx, { usePronoun, includePP: false });
    const predicate = this.buildVP(ctx, subject.features!, {
      includeObject: true,
      includePP: this.rng.chance(0.3),
      tense,
    });

    return {
      tokens: [...subject.tokens, ...predicate.tokens],
      features: subject.features,
    };
  }

  /**
   * Build a subordinate clause
   */
  buildSubordinateClause(ctx: GenerationContext): PhraseResult {
    const subordinator = this.wordProvider.getSubordinator();
    const clause = this.buildClause(ctx, {
      tense: this.rng.pick(['present', 'past']),
      usePronoun: this.rng.chance(0.5),
    });

    return {
      tokens: [subordinator, ...clause.tokens],
    };
  }

  /**
   * Build a relative clause
   */
  buildRelativeClause(ctx: GenerationContext, antecedentFeatures: PhraseFeatures): PhraseResult {
    const relativePronoun = this.wordProvider.getRelativePronoun();
    const vp = this.buildVP(ctx, antecedentFeatures, {
      includeObject: this.rng.chance(0.5),
      tense: 'present',
    });

    return {
      tokens: [relativePronoun, ...vp.tokens],
    };
  }
}
