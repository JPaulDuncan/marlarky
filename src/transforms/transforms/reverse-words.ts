/**
 * Word Reverse Transform (id="reverseWords")
 * Reverse letters per word, keep punctuation.
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

interface ReverseWordsParams {
  mode: 'full' | 'innerOnly';
  preserveCase: boolean;
}

const DEFAULT_PARAMS: ReverseWordsParams = {
  mode: 'full',
  preserveCase: true,
};

function isUpperCase(ch: string): boolean {
  return ch >= 'A' && ch <= 'Z';
}

function reverseWord(word: string, params: ReverseWordsParams): string {
  if (word.length <= 1) return word;

  if (params.mode === 'full') {
    const reversed = word.split('').reverse().join('');
    if (params.preserveCase) {
      // Transfer original casing pattern to reversed string
      let result = '';
      for (let i = 0; i < reversed.length; i++) {
        if (i < word.length && isUpperCase(word[i]!)) {
          result += reversed[i]!.toUpperCase();
        } else {
          result += reversed[i]!.toLowerCase();
        }
      }
      return result;
    }
    return reversed;
  }

  // innerOnly: keep first and last letter fixed, reverse inner
  if (word.length <= 2) return word;

  const first = word[0]!;
  const last = word[word.length - 1]!;
  const inner = word.slice(1, -1).split('').reverse().join('');

  if (params.preserveCase) {
    let result = '';
    const combined = first + inner + last;
    for (let i = 0; i < combined.length; i++) {
      if (i < word.length && isUpperCase(word[i]!)) {
        result += combined[i]!.toUpperCase();
      } else {
        result += combined[i]!.toLowerCase();
      }
    }
    return result;
  }

  return first + inner + last;
}

export const reverseWordsTransform: IOutputTransform = {
  id: 'reverseWords',
  version: '1.0.0',
  capabilities: {
    requiresTrace: false,
    posAware: false,
    deterministic: true,
    safeToStack: true,
    preferredOrder: 60,
  } satisfies TransformCapabilities,

  validateParams(params: unknown): ValidationResult {
    const errors: string[] = [];
    if (params && typeof params === 'object') {
      const p = params as Record<string, unknown>;
      if (p.mode && p.mode !== 'full' && p.mode !== 'innerOnly') {
        errors.push('mode must be "full" or "innerOnly"');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: ReverseWordsParams = { ...DEFAULT_PARAMS, ...(input.params as Partial<ReverseWordsParams>) };
    const tokens: Token[] = [];

    for (const token of input.tokens) {
      if (token.type === 'word' && !isProtected(token)) {
        tokens.push({ ...token, value: reverseWord(token.value, params) });
      } else {
        tokens.push({ ...token });
      }
    }

    return { tokens };
  },
};
