/**
 * Rule Engine
 * Evaluates constraints and invariants, handles repair strategies
 */

import type { GenerationContext } from '../types/context.js';
import type { Constraint, Invariant, POS } from '../types/lexicon.js';
import type { GeneratorConfig } from '../types/config.js';
import {
  isCapitalized,
  endsWithPunctuation,
  hasNoDoubleSpaces,
} from '../morphology/index.js';

export interface ConstraintResult {
  id: string;
  passed: boolean;
  message?: string;
}

export interface InvariantResult {
  id: string;
  passed: boolean;
  message?: string;
}

export interface ValidationResult {
  valid: boolean;
  constraintResults: ConstraintResult[];
  invariantResults: InvariantResult[];
  hardConstraintsFailed: string[];
  softConstraintsFailed: string[];
  invariantsFailed: string[];
}

export class RuleEngine {
  private config: GeneratorConfig;

  constructor(config: GeneratorConfig) {
    this.config = config;
  }

  /**
   * Evaluate all constraints for the current context and generated content
   */
  evaluateConstraints(
    constraints: Constraint[],
    ctx: GenerationContext,
    tokens: string[],
    scope: Constraint['scope']
  ): ConstraintResult[] {
    return constraints
      .filter(c => c.scope === scope)
      .map(c => this.evaluateConstraint(c, ctx, tokens));
  }

  /**
   * Evaluate a single constraint
   */
  evaluateConstraint(
    constraint: Constraint,
    ctx: GenerationContext,
    tokens: string[]
  ): ConstraintResult {
    switch (constraint.type) {
      case 'noRepeat':
        return this.evaluateNoRepeat(constraint, ctx, tokens);
      case 'maxCount':
        return this.evaluateMaxCount(constraint, ctx, tokens);
      case 'minCount':
        return this.evaluateMinCount(constraint, ctx, tokens);
      case 'required':
        return this.evaluateRequired(constraint, ctx, tokens);
      case 'forbidden':
        return this.evaluateForbidden(constraint, ctx, tokens);
      case 'custom':
        return { id: constraint.id, passed: true }; // Custom not implemented
      default:
        return { id: constraint.id, passed: true };
    }
  }

  /**
   * No repeat constraint: target item should not appear more than once
   */
  private evaluateNoRepeat(
    constraint: Constraint,
    ctx: GenerationContext,
    tokens: string[]
  ): ConstraintResult {
    const target = constraint.target;

    if (target.startsWith('pos:')) {
      const pos = target.slice(4) as POS;
      const posTerms = ctx.history.chosenTerms.get(pos) ?? [];
      const values = posTerms.map(t => t.value.toLowerCase());
      const uniqueValues = new Set(values);

      if (values.length !== uniqueValues.size) {
        return {
          id: constraint.id,
          passed: false,
          message: `Repeated ${pos} found in current scope`,
        };
      }
    } else if (target.startsWith('termSet:')) {
      const termSetId = target.slice(8);
      const count = ctx.history.chosenTermSets.filter(ts => ts === termSetId).length;
      if (count > 1) {
        return {
          id: constraint.id,
          passed: false,
          message: `Term set ${termSetId} used more than once`,
        };
      }
    } else {
      // Check token repetition
      const tokenLower = tokens.map(t => t.toLowerCase());
      const unique = new Set(tokenLower);
      if (tokenLower.length !== unique.size) {
        return {
          id: constraint.id,
          passed: false,
          message: 'Repeated tokens found',
        };
      }
    }

    return { id: constraint.id, passed: true };
  }

  /**
   * Max count constraint: target should not exceed specified count
   */
  private evaluateMaxCount(
    constraint: Constraint,
    _ctx: GenerationContext,
    tokens: string[]
  ): ConstraintResult {
    const target = constraint.target;
    const maxValue = constraint.value ?? 1;

    if (target === 'PP') {
      // Count prepositions as proxy for PPs
      const preps = new Set(this.config.determiners); // Rough proxy
      const count = tokens.filter(t => preps.has(t.toLowerCase())).length;
      if (count > maxValue) {
        return {
          id: constraint.id,
          passed: false,
          message: `PP count ${count} exceeds max ${maxValue}`,
        };
      }
    } else if (target === 'words') {
      if (tokens.length > maxValue) {
        return {
          id: constraint.id,
          passed: false,
          message: `Word count ${tokens.length} exceeds max ${maxValue}`,
        };
      }
    }

    return { id: constraint.id, passed: true };
  }

  /**
   * Min count constraint: target should meet minimum count
   */
  private evaluateMinCount(
    constraint: Constraint,
    _ctx: GenerationContext,
    tokens: string[]
  ): ConstraintResult {
    const target = constraint.target;
    const minValue = constraint.value ?? 1;

    if (target === 'words') {
      if (tokens.length < minValue) {
        return {
          id: constraint.id,
          passed: false,
          message: `Word count ${tokens.length} below min ${minValue}`,
        };
      }
    }

    return { id: constraint.id, passed: true };
  }

  /**
   * Required constraint: target must be present
   */
  private evaluateRequired(
    constraint: Constraint,
    ctx: GenerationContext,
    _tokens: string[]
  ): ConstraintResult {
    const target = constraint.target;

    if (target.startsWith('pos:')) {
      const pos = target.slice(4) as POS;
      const posTerms = ctx.history.chosenTerms.get(pos) ?? [];
      if (posTerms.length === 0) {
        return {
          id: constraint.id,
          passed: false,
          message: `Required ${pos} not found`,
        };
      }
    }

    return { id: constraint.id, passed: true };
  }

  /**
   * Forbidden constraint: target must not be present
   */
  private evaluateForbidden(
    constraint: Constraint,
    _ctx: GenerationContext,
    tokens: string[]
  ): ConstraintResult {
    const target = constraint.target;

    // Check if forbidden word/token is present
    const tokenLower = tokens.map(t => t.toLowerCase());
    if (tokenLower.includes(target.toLowerCase())) {
      return {
        id: constraint.id,
        passed: false,
        message: `Forbidden token "${target}" found`,
      };
    }

    return { id: constraint.id, passed: true };
  }

  /**
   * Evaluate all invariants for generated text
   */
  evaluateInvariants(
    invariants: Invariant[],
    text: string,
    scope: Invariant['scope']
  ): InvariantResult[] {
    return invariants
      .filter(inv => inv.scope === scope)
      .map(inv => this.evaluateInvariant(inv, text));
  }

  /**
   * Evaluate a single invariant
   */
  evaluateInvariant(invariant: Invariant, text: string): InvariantResult {
    switch (invariant.type) {
      case 'capitalization':
        return {
          id: invariant.id,
          passed: isCapitalized(text),
          message: isCapitalized(text) ? undefined : 'Text not properly capitalized',
        };

      case 'punctuation':
        return {
          id: invariant.id,
          passed: endsWithPunctuation(text),
          message: endsWithPunctuation(text) ? undefined : 'Text does not end with punctuation',
        };

      case 'whitespace':
        return {
          id: invariant.id,
          passed: hasNoDoubleSpaces(text),
          message: hasNoDoubleSpaces(text) ? undefined : 'Text contains double spaces',
        };

      case 'agreement':
        // Subject-verb agreement is handled during generation
        return { id: invariant.id, passed: true };

      case 'custom':
        return { id: invariant.id, passed: true }; // Custom not implemented

      default:
        return { id: invariant.id, passed: true };
    }
  }

  /**
   * Full validation of generated content
   */
  validate(
    constraints: Constraint[],
    invariants: Invariant[],
    ctx: GenerationContext,
    text: string,
    tokens: string[],
    scope: Constraint['scope']
  ): ValidationResult {
    const constraintResults = this.evaluateConstraints(constraints, ctx, tokens, scope);
    const invariantResults = this.evaluateInvariants(invariants, text, scope);

    const hardConstraintsFailed = constraintResults
      .filter(r => !r.passed)
      .filter(r => constraints.find(c => c.id === r.id)?.level === 'hard')
      .map(r => r.id);

    const softConstraintsFailed = constraintResults
      .filter(r => !r.passed)
      .filter(r => constraints.find(c => c.id === r.id)?.level === 'soft')
      .map(r => r.id);

    const invariantsFailed = invariantResults
      .filter(r => !r.passed)
      .map(r => r.id);

    return {
      valid: hardConstraintsFailed.length === 0 && invariantsFailed.length === 0,
      constraintResults,
      invariantResults,
      hardConstraintsFailed,
      softConstraintsFailed,
      invariantsFailed,
    };
  }

  /**
   * Get default invariants
   */
  getDefaultInvariants(): Invariant[] {
    return [
      { id: 'inv.capitalized', type: 'capitalization', scope: 'sentence' },
      { id: 'inv.endsWithPunct', type: 'punctuation', scope: 'sentence' },
      { id: 'inv.noDoubleSpaces', type: 'whitespace', scope: 'text' },
    ];
  }

  /**
   * Get default constraints
   */
  getDefaultConstraints(): Constraint[] {
    return [
      {
        id: 'c.maxPP',
        level: 'hard',
        scope: 'phrase',
        type: 'maxCount',
        target: 'PP',
        value: this.config.maxPPChain,
      },
      {
        id: 'c.minWords',
        level: 'soft',
        scope: 'sentence',
        type: 'minCount',
        target: 'words',
        value: this.config.minWordsPerSentence,
      },
      {
        id: 'c.maxWords',
        level: 'soft',
        scope: 'sentence',
        type: 'maxCount',
        target: 'words',
        value: this.config.maxWordsPerSentence,
      },
    ];
  }
}
