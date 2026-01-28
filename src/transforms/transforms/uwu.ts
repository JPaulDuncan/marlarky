/**
 * Uwu Transform (id="uwu")
 * "Cute speak" phonetic + embellishments.
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
import type { IRng } from '../../interfaces/rng.js';

interface UwuParams {
  rToW: boolean;
  lToW: boolean;
  insertNyaRate: number;
  suffixes: string[];
  suffixRate: number;
  preserveCase: boolean;
}

const DEFAULT_PARAMS: UwuParams = {
  rToW: true,
  lToW: true,
  insertNyaRate: 0.08,
  suffixes: ['~', ' owo', ' uwu', ' :3'],
  suffixRate: 0.06,
  preserveCase: true,
};

/** Replace r/l with w, handle nya substitution */
function transformWord(word: string, params: UwuParams, rng: IRng): string {
  let result = '';

  for (let i = 0; i < word.length; i++) {
    const ch = word[i]!;
    const lower = ch.toLowerCase();

    // r → w
    if (params.rToW && (lower === 'r')) {
      const replacement = ch >= 'A' && ch <= 'Z' ? 'W' : 'w';
      result += params.preserveCase ? replacement : 'w';
      continue;
    }

    // l → w
    if (params.lToW && (lower === 'l')) {
      const replacement = ch >= 'A' && ch <= 'Z' ? 'W' : 'w';
      result += params.preserveCase ? replacement : 'w';
      continue;
    }

    // na/ne/ni/no/nu → nya/nye/nyi/nyo/nyu
    if (lower === 'n' && i + 1 < word.length) {
      const nextLower = word[i + 1]!.toLowerCase();
      if ('aeiou'.includes(nextLower) && rng.chance(params.insertNyaRate)) {
        result += ch;
        result += (ch >= 'A' && ch <= 'Z') ? 'Y' : 'y';
        continue;
      }
    }

    result += ch;
  }

  return result;
}

export const uwuTransform: IOutputTransform = {
  id: 'uwu',
  version: '1.0.0',
  capabilities: {
    requiresTrace: false,
    posAware: false,
    deterministic: true,
    safeToStack: true,
    preferredOrder: 25,
  } satisfies TransformCapabilities,

  validateParams(params: unknown): ValidationResult {
    const errors: string[] = [];
    if (params && typeof params === 'object') {
      const p = params as Record<string, unknown>;
      if (p.insertNyaRate !== undefined) {
        const rate = p.insertNyaRate as number;
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
          errors.push('insertNyaRate must be between 0 and 1');
        }
      }
      if (p.suffixRate !== undefined) {
        const rate = p.suffixRate as number;
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
          errors.push('suffixRate must be between 0 and 1');
        }
      }
      if (p.suffixes !== undefined && !Array.isArray(p.suffixes)) {
        errors.push('suffixes must be an array');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: UwuParams = { ...DEFAULT_PARAMS, ...(input.params as Partial<UwuParams>) };
    const tokens: Token[] = [];

    for (const token of input.tokens) {
      if (token.type === 'word' && !isProtected(token)) {
        tokens.push({ ...token, value: transformWord(token.value, params, input.rng) });
      } else {
        tokens.push({ ...token });
      }
    }

    // Add suffix at end of sentence occasionally
    // Look for sentence-ending punctuation and insert suffix before it
    if (params.suffixes.length > 0) {
      for (let i = tokens.length - 1; i >= 0; i--) {
        const t = tokens[i]!;
        if (t.type === 'punct' && (t.value === '.' || t.value === '!' || t.value === '?')) {
          if (input.rng.chance(params.suffixRate)) {
            const suffix = input.rng.pick(params.suffixes);
            // Insert suffix as a symbol token before punctuation
            tokens.splice(i, 0, { type: 'symbol', value: suffix });
          }
          break;
        }
      }
    }

    return { tokens };
  },
};
