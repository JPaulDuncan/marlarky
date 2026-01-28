/**
 * Sentence Templates
 * Defines and builds various sentence structures
 */

import type { IRng } from '../interfaces/rng.js';
import type { GeneratorConfig } from '../types/config.js';
import type { GenerationContext } from '../types/context.js';
import type { PhraseBuilders } from './phrase-builders.js';
import { joinTokens, formatSentence } from '../morphology/index.js';

export type SentenceType =
  | 'simpleDeclarative'
  | 'compound'
  | 'introAdverbial'
  | 'subordinate'
  | 'interjection'
  | 'question';

export interface SentenceResult {
  text: string;
  type: SentenceType;
  tokens: string[];
}

export class SentenceTemplates {
  private phraseBuilders: PhraseBuilders;
  private rng: IRng;
  private config: GeneratorConfig;

  constructor(phraseBuilders: PhraseBuilders, rng: IRng, config: GeneratorConfig) {
    this.phraseBuilders = phraseBuilders;
    this.rng = rng;
    this.config = config;
  }

  /**
   * Select a sentence type based on weights
   */
  selectSentenceType(): SentenceType {
    const weights = this.config.sentenceTypeWeights;
    const total =
      weights.simpleDeclarative +
      weights.compound +
      weights.introAdverbial +
      weights.subordinate +
      weights.interjection +
      weights.question;

    const rand = this.rng.float() * total;
    let cumulative = 0;

    cumulative += weights.simpleDeclarative;
    if (rand < cumulative) return 'simpleDeclarative';

    cumulative += weights.compound;
    if (rand < cumulative) return 'compound';

    cumulative += weights.introAdverbial;
    if (rand < cumulative) return 'introAdverbial';

    cumulative += weights.subordinate;
    if (rand < cumulative) return 'subordinate';

    cumulative += weights.interjection;
    if (rand < cumulative) return 'interjection';

    return 'question';
  }

  /**
   * Build a sentence of the given type
   */
  buildSentence(ctx: GenerationContext, type?: SentenceType): SentenceResult {
    const sentenceType = type ?? this.selectSentenceType();

    switch (sentenceType) {
      case 'simpleDeclarative':
        return this.buildSimpleDeclarative(ctx);
      case 'compound':
        return this.buildCompound(ctx);
      case 'introAdverbial':
        return this.buildIntroAdverbial(ctx);
      case 'subordinate':
        return this.buildSubordinate(ctx);
      case 'interjection':
        return this.buildInterjection(ctx);
      case 'question':
        return this.buildQuestion(ctx);
      default:
        return this.buildSimpleDeclarative(ctx);
    }
  }

  /**
   * Simple declarative: NP VP
   * "The system processes data."
   */
  buildSimpleDeclarative(ctx: GenerationContext): SentenceResult {
    const clause = this.phraseBuilders.buildClause(ctx, {
      tense: this.rng.pick(['present', 'past']),
      usePronoun: this.rng.chance(0.3),
    });

    const text = formatSentence(joinTokens(clause.tokens));

    return {
      text,
      type: 'simpleDeclarative',
      tokens: clause.tokens,
    };
  }

  /**
   * Compound: CLAUSE, CONJ CLAUSE
   * "The team works hard, and the project succeeds."
   */
  buildCompound(ctx: GenerationContext): SentenceResult {
    const tense = this.rng.pick(['present', 'past']) as 'present' | 'past';

    const clause1 = this.phraseBuilders.buildClause(ctx, { tense });
    const conjunction = this.rng.pick(this.config.coordinators);
    const clause2 = this.phraseBuilders.buildClause(ctx, { tense });

    const tokens = [...clause1.tokens, ',', conjunction, ...clause2.tokens];
    const text = formatSentence(joinTokens(tokens));

    return {
      text,
      type: 'compound',
      tokens,
    };
  }

  /**
   * Intro adverbial: ADVP/PP, CLAUSE
   * "Generally, the system performs well."
   * "In most cases, the results are positive."
   */
  buildIntroAdverbial(ctx: GenerationContext): SentenceResult {
    const tokens: string[] = [];

    // Choose between transition word or PP
    if (this.rng.chance(0.6)) {
      const transition = this.rng.pick(this.config.transitions);
      tokens.push(transition);
    } else {
      const pp = this.phraseBuilders.buildPP(ctx);
      tokens.push(...pp.tokens);
    }

    tokens.push(',');

    const clause = this.phraseBuilders.buildClause(ctx, {
      tense: this.rng.pick(['present', 'past']),
    });
    tokens.push(...clause.tokens);

    const text = formatSentence(joinTokens(tokens));

    return {
      text,
      type: 'introAdverbial',
      tokens,
    };
  }

  /**
   * Subordinate: SUBCLAUSE, CLAUSE or CLAUSE SUBCLAUSE
   * "Because the data is accurate, the results are reliable."
   * "The system works well when conditions are optimal."
   */
  buildSubordinate(ctx: GenerationContext): SentenceResult {
    const tokens: string[] = [];

    const subClause = this.phraseBuilders.buildSubordinateClause(ctx);
    const mainClause = this.phraseBuilders.buildClause(ctx, {
      tense: this.rng.pick(['present', 'past']),
    });

    // Subordinate clause first or last
    if (this.rng.chance(0.5)) {
      // Subordinate first
      tokens.push(...subClause.tokens, ',', ...mainClause.tokens);
    } else {
      // Main clause first
      tokens.push(...mainClause.tokens, ...subClause.tokens);
    }

    const text = formatSentence(joinTokens(tokens));

    return {
      text,
      type: 'subordinate',
      tokens,
    };
  }

  /**
   * Interjection: INTJ, CLAUSE
   * "Indeed, the approach is effective."
   */
  buildInterjection(ctx: GenerationContext): SentenceResult {
    const tokens: string[] = [];

    const interjection = this.rng.pick(this.config.interjections);
    tokens.push(interjection, ',');

    const clause = this.phraseBuilders.buildClause(ctx, {
      tense: 'present',
    });
    tokens.push(...clause.tokens);

    const text = formatSentence(joinTokens(tokens));

    return {
      text,
      type: 'interjection',
      tokens,
    };
  }

  /**
   * Question: Do/Does/Did NP VP? or WH NP VP?
   * "Does the system work efficiently?"
   * "What makes the process effective?"
   */
  buildQuestion(ctx: GenerationContext): SentenceResult {
    const tokens: string[] = [];

    // Choose between yes/no question or wh-question
    if (this.rng.chance(0.6)) {
      // Yes/no question with do-support
      const subject = this.phraseBuilders.buildNP(ctx, {
        usePronoun: this.rng.chance(0.4),
        includePP: false,
      });

      // Select do/does/did based on subject and tense
      const isPast = this.rng.chance(0.3);
      let doAux: string;
      if (isPast) {
        doAux = 'did';
      } else if (subject.features!.number === 'singular' && subject.features!.person === 3) {
        doAux = 'does';
      } else {
        doAux = 'do';
      }

      tokens.push(doAux);
      tokens.push(...subject.tokens);

      // VP in base form (after do-support)
      const vp = this.phraseBuilders.buildVP(ctx, subject.features!, {
        includeObject: true,
        tense: 'present', // Base form after do-support
      });

      // Remove any conjugated form (the VP might have conjugated it)
      tokens.push(...vp.tokens);
    } else {
      // Wh-question
      const whWord = this.rng.pick(['what', 'how', 'why', 'when', 'where']);
      tokens.push(whWord);

      if (whWord === 'what' || whWord === 'how') {
        // "What makes X work?" or "How does X work?"
        if (this.rng.chance(0.5)) {
          // "What + VP"
          const vp = this.phraseBuilders.buildVP(ctx, { number: 'singular', person: 3 }, {
            includeObject: true,
          });
          tokens.push(...vp.tokens);
        } else {
          // "How does NP VP"
          const subject = this.phraseBuilders.buildNP(ctx, { includePP: false });
          const doAux = subject.features!.number === 'singular' && subject.features!.person === 3 ? 'does' : 'do';
          tokens.push(doAux);
          tokens.push(...subject.tokens);
          const vp = this.phraseBuilders.buildVP(ctx, subject.features!, { includeObject: false });
          tokens.push(...vp.tokens);
        }
      } else {
        // "Why/When/Where does NP VP"
        const subject = this.phraseBuilders.buildNP(ctx, { includePP: false });
        const doAux = subject.features!.number === 'singular' && subject.features!.person === 3 ? 'does' : 'do';
        tokens.push(doAux);
        tokens.push(...subject.tokens);
        const vp = this.phraseBuilders.buildVP(ctx, subject.features!, { includeObject: true });
        tokens.push(...vp.tokens);
      }
    }

    const text = formatSentence(joinTokens(tokens), '?');

    return {
      text,
      type: 'question',
      tokens,
    };
  }

  /**
   * Build a sentence with a relative clause
   * "The system that processes data is efficient."
   */
  buildWithRelativeClause(ctx: GenerationContext): SentenceResult {
    // Build subject NP
    const subject = this.phraseBuilders.buildNP(ctx, { includePP: false });

    // Build relative clause
    const relClause = this.phraseBuilders.buildRelativeClause(ctx, subject.features!);

    // Build main VP
    const vp = this.phraseBuilders.buildVP(ctx, subject.features!, {
      includeObject: false,
    });

    const tokens = [...subject.tokens, ...relClause.tokens, ...vp.tokens];
    const text = formatSentence(joinTokens(tokens));

    return {
      text,
      type: 'simpleDeclarative', // Classify as declarative
      tokens,
    };
  }
}
