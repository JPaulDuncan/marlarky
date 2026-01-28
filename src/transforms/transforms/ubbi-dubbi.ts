/**
 * Ubbi Dubbi Transform (id="ubbiDubbi")
 * Insert prefix before vowel sound groups.
 */

import type {
  IOutputTransform,
  TransformCapabilities,
  TransformInput,
  TransformOutput,
  ValidationResult,
  Token,
} from '../types.js';
import { isProtected } from '../protection.js';

interface UbbiDubbiParams {
  prefix: string;
  treatYAsVowel: 'never' | 'sometimes' | 'always';
  preserveCase: boolean;
  mode: 'beforeEachVowel' | 'beforeVowelGroups';
  maxInsertionsPerWord?: number;
}

const DEFAULT_PARAMS: UbbiDubbiParams = {
  prefix: 'ub',
  treatYAsVowel: 'sometimes',
  preserveCase: true,
  mode: 'beforeVowelGroups',
};

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u']);

function isVowel(ch: string, position: number, params: UbbiDubbiParams): boolean {
  const lower = ch.toLowerCase();
  if (VOWELS.has(lower)) return true;
  if (lower === 'y') {
    if (params.treatYAsVowel === 'always') return true;
    if (params.treatYAsVowel === 'never') return false;
    return position > 0;
  }
  return false;
}

function isUpperCase(ch: string): boolean {
  return ch >= 'A' && ch <= 'Z';
}

function transformWord(word: string, params: UbbiDubbiParams): string {
  const result: string[] = [];
  let insertions = 0;
  const max = params.maxInsertionsPerWord ?? Infinity;
  let inVowelGroup = false;

  for (let i = 0; i < word.length; i++) {
    const ch = word[i]!;
    const vowel = isVowel(ch, i, params);

    if (vowel) {
      if (params.mode === 'beforeVowelGroups') {
        if (!inVowelGroup && insertions < max) {
          // Insert prefix before vowel group
          if (params.preserveCase && isUpperCase(ch)) {
            result.push(params.prefix[0]!.toUpperCase() + params.prefix.slice(1));
            result.push(ch.toLowerCase());
          } else {
            result.push(params.prefix);
            result.push(ch);
          }
          insertions++;
          inVowelGroup = true;
          continue;
        }
      } else {
        // beforeEachVowel mode
        if (insertions < max) {
          if (params.preserveCase && isUpperCase(ch)) {
            result.push(params.prefix[0]!.toUpperCase() + params.prefix.slice(1));
            result.push(ch.toLowerCase());
          } else {
            result.push(params.prefix);
            result.push(ch);
          }
          insertions++;
          continue;
        }
      }
    } else {
      inVowelGroup = false;
    }

    result.push(ch);
  }

  return result.join('');
}

export const ubbiDubbiTransform: IOutputTransform = {
  id: 'ubbiDubbi',
  version: '1.0.0',
  capabilities: {
    requiresTrace: false,
    posAware: false,
    deterministic: true,
    safeToStack: true,
    preferredOrder: 40,
  } satisfies TransformCapabilities,

  validateParams(params: unknown): ValidationResult {
    const errors: string[] = [];
    if (params && typeof params === 'object') {
      const p = params as Record<string, unknown>;
      if (p.prefix !== undefined && typeof p.prefix !== 'string') {
        errors.push('prefix must be a string');
      }
      if (p.treatYAsVowel && !['never', 'sometimes', 'always'].includes(p.treatYAsVowel as string)) {
        errors.push('treatYAsVowel must be "never", "sometimes", or "always"');
      }
      if (p.mode && p.mode !== 'beforeEachVowel' && p.mode !== 'beforeVowelGroups') {
        errors.push('mode must be "beforeEachVowel" or "beforeVowelGroups"');
      }
      if (p.maxInsertionsPerWord !== undefined && (typeof p.maxInsertionsPerWord !== 'number' || p.maxInsertionsPerWord < 0)) {
        errors.push('maxInsertionsPerWord must be a non-negative number');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: UbbiDubbiParams = { ...DEFAULT_PARAMS, ...(input.params as Partial<UbbiDubbiParams>) };
    const tokens: Token[] = [];

    for (const token of input.tokens) {
      if (token.type === 'word' && !isProtected(token)) {
        tokens.push({ ...token, value: transformWord(token.value, params) });
      } else {
        tokens.push({ ...token });
      }
    }

    return { tokens };
  },
};
