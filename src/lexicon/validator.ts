/**
 * Lexicon Validator
 * Validates lexicon JSON structure and returns structured errors
 */

import type { POS } from '../types/lexicon.js';
import type { LexiconValidationResult, LexiconValidationError } from '../types/api.js';

const VALID_POS: POS[] = ['noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'intj', 'det'];
const VALID_SCOPES = ['token', 'phrase', 'clause', 'sentence', 'paragraph', 'text'] as const;
const VALID_CONSTRAINT_TYPES = ['noRepeat', 'maxCount', 'minCount', 'required', 'forbidden', 'custom'] as const;
const VALID_INVARIANT_TYPES = ['capitalization', 'punctuation', 'whitespace', 'agreement', 'custom'] as const;
const VALID_PATTERN_TYPES = ['sentence', 'nounPhrase', 'verbPhrase', 'prepPhrase', 'adjPhrase', 'advPhrase', 'clause'] as const;

/**
 * Validate a lexicon object
 */
export function validateLexicon(lexicon: unknown): LexiconValidationResult {
  const errors: LexiconValidationError[] = [];
  const warnings: LexiconValidationError[] = [];

  if (!lexicon || typeof lexicon !== 'object') {
    errors.push({ path: '', message: 'Lexicon must be an object', severity: 'error' });
    return { valid: false, errors, warnings };
  }

  const lex = lexicon as Record<string, unknown>;

  // Required fields
  if (typeof lex.id !== 'string' || lex.id.trim() === '') {
    errors.push({ path: 'id', message: 'Lexicon must have a non-empty string "id"', severity: 'error' });
  }

  if (typeof lex.language !== 'string' || lex.language.trim() === '') {
    errors.push({ path: 'language', message: 'Lexicon must have a non-empty string "language"', severity: 'error' });
  }

  // Optional version
  if (lex.version !== undefined && typeof lex.version !== 'string') {
    warnings.push({ path: 'version', message: 'Version should be a string', severity: 'warning' });
  }

  // Validate termSets
  if (lex.termSets !== undefined) {
    validateTermSets(lex.termSets, errors, warnings);
  }

  // Validate patterns
  if (lex.patterns !== undefined) {
    validatePatterns(lex.patterns, errors, warnings);
  }

  // Validate distributions
  if (lex.distributions !== undefined) {
    validateDistributions(lex.distributions, errors, warnings);
  }

  // Validate correlations
  if (lex.correlations !== undefined) {
    validateCorrelations(lex.correlations, errors, warnings);
  }

  // Validate constraints
  if (lex.constraints !== undefined) {
    validateConstraints(lex.constraints, errors, warnings);
  }

  // Validate invariants
  if (lex.invariants !== undefined) {
    validateInvariants(lex.invariants, errors, warnings);
  }

  // Validate archetypes
  if (lex.archetypes !== undefined) {
    validateArchetypes(lex.archetypes, errors, warnings);
  }

  // Validate relations
  if (lex.relations !== undefined) {
    validateRelations(lex.relations, errors, warnings);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateTermSets(
  termSets: unknown,
  errors: LexiconValidationError[],
  warnings: LexiconValidationError[]
): void {
  if (typeof termSets !== 'object' || termSets === null) {
    errors.push({ path: 'termSets', message: 'termSets must be an object', severity: 'error' });
    return;
  }

  for (const [id, termSet] of Object.entries(termSets)) {
    const path = `termSets.${id}`;

    if (typeof termSet !== 'object' || termSet === null) {
      errors.push({ path, message: 'Term set must be an object', severity: 'error' });
      continue;
    }

    const ts = termSet as Record<string, unknown>;

    if (!VALID_POS.includes(ts.pos as POS)) {
      errors.push({ path: `${path}.pos`, message: `Invalid POS: ${ts.pos}. Must be one of: ${VALID_POS.join(', ')}`, severity: 'error' });
    }

    if (ts.tags !== undefined && !Array.isArray(ts.tags)) {
      warnings.push({ path: `${path}.tags`, message: 'tags should be an array', severity: 'warning' });
    }

    if (!Array.isArray(ts.terms)) {
      errors.push({ path: `${path}.terms`, message: 'terms must be an array', severity: 'error' });
    } else {
      ts.terms.forEach((term: unknown, index: number) => {
        validateTerm(term, `${path}.terms[${index}]`, errors, warnings);
      });
    }
  }
}

function validateTerm(
  term: unknown,
  path: string,
  errors: LexiconValidationError[],
  warnings: LexiconValidationError[]
): void {
  if (typeof term !== 'object' || term === null) {
    errors.push({ path, message: 'Term must be an object', severity: 'error' });
    return;
  }

  const t = term as Record<string, unknown>;

  if (typeof t.value !== 'string' || t.value.trim() === '') {
    errors.push({ path: `${path}.value`, message: 'Term must have a non-empty string "value"', severity: 'error' });
  }

  if (t.weight !== undefined && (typeof t.weight !== 'number' || t.weight < 0)) {
    warnings.push({ path: `${path}.weight`, message: 'weight should be a non-negative number', severity: 'warning' });
  }

  if (t.tags !== undefined && !Array.isArray(t.tags)) {
    warnings.push({ path: `${path}.tags`, message: 'tags should be an array', severity: 'warning' });
  }
}

function validatePatterns(
  patterns: unknown,
  errors: LexiconValidationError[],
  _warnings: LexiconValidationError[]
): void {
  if (typeof patterns !== 'object' || patterns === null) {
    errors.push({ path: 'patterns', message: 'patterns must be an object', severity: 'error' });
    return;
  }

  for (const [id, pattern] of Object.entries(patterns)) {
    const path = `patterns.${id}`;

    if (typeof pattern !== 'object' || pattern === null) {
      errors.push({ path, message: 'Pattern must be an object', severity: 'error' });
      continue;
    }

    const p = pattern as Record<string, unknown>;

    if (!VALID_PATTERN_TYPES.includes(p.type as typeof VALID_PATTERN_TYPES[number])) {
      errors.push({ path: `${path}.type`, message: `Invalid pattern type: ${p.type}`, severity: 'error' });
    }

    if (!Array.isArray(p.slots)) {
      errors.push({ path: `${path}.slots`, message: 'slots must be an array', severity: 'error' });
    }
  }
}

function validateDistributions(
  distributions: unknown,
  errors: LexiconValidationError[],
  warnings: LexiconValidationError[]
): void {
  if (typeof distributions !== 'object' || distributions === null) {
    errors.push({ path: 'distributions', message: 'distributions must be an object', severity: 'error' });
    return;
  }

  for (const [id, dist] of Object.entries(distributions)) {
    const path = `distributions.${id}`;

    if (!Array.isArray(dist)) {
      errors.push({ path, message: 'Distribution must be an array', severity: 'error' });
      continue;
    }

    dist.forEach((entry: unknown, index: number) => {
      if (typeof entry !== 'object' || entry === null) {
        errors.push({ path: `${path}[${index}]`, message: 'Distribution entry must be an object', severity: 'error' });
        return;
      }

      const e = entry as Record<string, unknown>;
      if (typeof e.key !== 'string') {
        errors.push({ path: `${path}[${index}].key`, message: 'key must be a string', severity: 'error' });
      }
      if (typeof e.weight !== 'number' || e.weight < 0) {
        warnings.push({ path: `${path}[${index}].weight`, message: 'weight should be a non-negative number', severity: 'warning' });
      }
    });
  }
}

function validateCorrelations(
  correlations: unknown,
  errors: LexiconValidationError[],
  warnings: LexiconValidationError[]
): void {
  if (!Array.isArray(correlations)) {
    errors.push({ path: 'correlations', message: 'correlations must be an array', severity: 'error' });
    return;
  }

  correlations.forEach((corr: unknown, index: number) => {
    const path = `correlations[${index}]`;

    if (typeof corr !== 'object' || corr === null) {
      errors.push({ path, message: 'Correlation must be an object', severity: 'error' });
      return;
    }

    const c = corr as Record<string, unknown>;

    if (typeof c.when !== 'object' || c.when === null) {
      errors.push({ path: `${path}.when`, message: 'when must be an object', severity: 'error' });
    }

    if (!Array.isArray(c.thenBoost)) {
      errors.push({ path: `${path}.thenBoost`, message: 'thenBoost must be an array', severity: 'error' });
    }

    if (!VALID_SCOPES.includes(c.scope as typeof VALID_SCOPES[number])) {
      warnings.push({ path: `${path}.scope`, message: `Invalid scope: ${c.scope}`, severity: 'warning' });
    }
  });
}

function validateConstraints(
  constraints: unknown,
  errors: LexiconValidationError[],
  _warnings: LexiconValidationError[]
): void {
  if (!Array.isArray(constraints)) {
    errors.push({ path: 'constraints', message: 'constraints must be an array', severity: 'error' });
    return;
  }

  constraints.forEach((constraint: unknown, index: number) => {
    const path = `constraints[${index}]`;

    if (typeof constraint !== 'object' || constraint === null) {
      errors.push({ path, message: 'Constraint must be an object', severity: 'error' });
      return;
    }

    const c = constraint as Record<string, unknown>;

    if (typeof c.id !== 'string') {
      errors.push({ path: `${path}.id`, message: 'id must be a string', severity: 'error' });
    }

    if (c.level !== 'hard' && c.level !== 'soft') {
      errors.push({ path: `${path}.level`, message: 'level must be "hard" or "soft"', severity: 'error' });
    }

    if (!VALID_SCOPES.includes(c.scope as typeof VALID_SCOPES[number])) {
      errors.push({ path: `${path}.scope`, message: `Invalid scope: ${c.scope}`, severity: 'error' });
    }

    if (!VALID_CONSTRAINT_TYPES.includes(c.type as typeof VALID_CONSTRAINT_TYPES[number])) {
      errors.push({ path: `${path}.type`, message: `Invalid constraint type: ${c.type}`, severity: 'error' });
    }

    if (typeof c.target !== 'string') {
      errors.push({ path: `${path}.target`, message: 'target must be a string', severity: 'error' });
    }
  });
}

function validateInvariants(
  invariants: unknown,
  errors: LexiconValidationError[],
  _warnings: LexiconValidationError[]
): void {
  if (!Array.isArray(invariants)) {
    errors.push({ path: 'invariants', message: 'invariants must be an array', severity: 'error' });
    return;
  }

  invariants.forEach((invariant: unknown, index: number) => {
    const path = `invariants[${index}]`;

    if (typeof invariant !== 'object' || invariant === null) {
      errors.push({ path, message: 'Invariant must be an object', severity: 'error' });
      return;
    }

    const inv = invariant as Record<string, unknown>;

    if (typeof inv.id !== 'string') {
      errors.push({ path: `${path}.id`, message: 'id must be a string', severity: 'error' });
    }

    if (!VALID_INVARIANT_TYPES.includes(inv.type as typeof VALID_INVARIANT_TYPES[number])) {
      errors.push({ path: `${path}.type`, message: `Invalid invariant type: ${inv.type}`, severity: 'error' });
    }

    if (!VALID_SCOPES.includes(inv.scope as typeof VALID_SCOPES[number])) {
      errors.push({ path: `${path}.scope`, message: `Invalid scope: ${inv.scope}`, severity: 'error' });
    }
  });
}

function validateArchetypes(
  archetypes: unknown,
  errors: LexiconValidationError[],
  _warnings: LexiconValidationError[]
): void {
  if (typeof archetypes !== 'object' || archetypes === null) {
    errors.push({ path: 'archetypes', message: 'archetypes must be an object', severity: 'error' });
    return;
  }

  for (const [id, archetype] of Object.entries(archetypes)) {
    const path = `archetypes.${id}`;

    if (typeof archetype !== 'object' || archetype === null) {
      errors.push({ path, message: 'Archetype must be an object', severity: 'error' });
    }
  }
}

function validateRelations(
  relations: unknown,
  errors: LexiconValidationError[],
  warnings: LexiconValidationError[]
): void {
  if (!Array.isArray(relations)) {
    errors.push({ path: 'relations', message: 'relations must be an array', severity: 'error' });
    return;
  }

  relations.forEach((relation: unknown, index: number) => {
    const path = `relations[${index}]`;

    if (typeof relation !== 'object' || relation === null) {
      errors.push({ path, message: 'Relation must be an object', severity: 'error' });
      return;
    }

    const r = relation as Record<string, unknown>;

    if (typeof r.from !== 'string') {
      errors.push({ path: `${path}.from`, message: 'from must be a string', severity: 'error' });
    }

    if (typeof r.type !== 'string') {
      errors.push({ path: `${path}.type`, message: 'type must be a string', severity: 'error' });
    }

    if (typeof r.to !== 'string') {
      errors.push({ path: `${path}.to`, message: 'to must be a string', severity: 'error' });
    }

    if (r.weight !== undefined && (typeof r.weight !== 'number' || r.weight < 0)) {
      warnings.push({ path: `${path}.weight`, message: 'weight should be a non-negative number', severity: 'warning' });
    }
  });
}
