/**
 * Mocking Case Transform (id="mockCase")
 * Alternating case effect.
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

interface MockCaseParams {
  mode: 'alternate' | 'randomized';
  randomRate: number;
  scope: 'word' | 'sentence';
  preserveNonLetters: boolean;
}

const DEFAULT_PARAMS: MockCaseParams = {
  mode: 'alternate',
  randomRate: 0.4,
  scope: 'word',
  preserveNonLetters: true,
};

function isLetter(ch: string): boolean {
  const c = ch.charCodeAt(0);
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

function alternateCase(word: string, startUpper: boolean): string {
  let upper = startUpper;
  let result = '';

  for (const ch of word) {
    if (isLetter(ch)) {
      result += upper ? ch.toUpperCase() : ch.toLowerCase();
      upper = !upper;
    } else {
      result += ch;
    }
  }

  return result;
}

function randomizedCase(word: string, rate: number, rng: IRng): string {
  let result = '';

  for (const ch of word) {
    if (isLetter(ch)) {
      result += rng.chance(rate) ? ch.toUpperCase() : ch.toLowerCase();
    } else {
      result += ch;
    }
  }

  return result;
}

export const mockCaseTransform: IOutputTransform = {
  id: 'mockCase',
  version: '1.0.0',
  capabilities: {
    requiresTrace: false,
    posAware: false,
    deterministic: true,
    safeToStack: true,
    preferredOrder: 50,
  } satisfies TransformCapabilities,

  validateParams(params: unknown): ValidationResult {
    const errors: string[] = [];
    if (params && typeof params === 'object') {
      const p = params as Record<string, unknown>;
      if (p.mode && p.mode !== 'alternate' && p.mode !== 'randomized') {
        errors.push('mode must be "alternate" or "randomized"');
      }
      if (p.randomRate !== undefined) {
        const rate = p.randomRate as number;
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
          errors.push('randomRate must be between 0 and 1');
        }
      }
      if (p.scope && p.scope !== 'word' && p.scope !== 'sentence') {
        errors.push('scope must be "word" or "sentence"');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: MockCaseParams = { ...DEFAULT_PARAMS, ...(input.params as Partial<MockCaseParams>) };
    const tokens: Token[] = [];

    if (params.mode === 'alternate') {
      // For 'sentence' scope: maintain letter index across all tokens
      let globalLetterIdx = 0;

      for (const token of input.tokens) {
        if (token.type === 'word' && !isProtected(token)) {
          if (params.scope === 'word') {
            tokens.push({ ...token, value: alternateCase(token.value, false) });
          } else {
            // sentence scope: continue alternation across words
            let result = '';
            for (const ch of token.value) {
              if (isLetter(ch)) {
                result += (globalLetterIdx % 2 === 0) ? ch.toLowerCase() : ch.toUpperCase();
                globalLetterIdx++;
              } else {
                result += ch;
              }
            }
            tokens.push({ ...token, value: result });
          }
        } else {
          tokens.push({ ...token });
        }
      }
    } else {
      // randomized mode
      for (const token of input.tokens) {
        if (token.type === 'word' && !isProtected(token)) {
          tokens.push({ ...token, value: randomizedCase(token.value, params.randomRate, input.rng) });
        } else {
          tokens.push({ ...token });
        }
      }
    }

    return { tokens };
  },
};
