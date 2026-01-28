/**
 * Pig Latin Transform (id="pigLatin")
 * Standard Pig Latin word transformation.
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

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u', 'A', 'E', 'I', 'O', 'U']);

interface PigLatinParams {
  style: 'classic' | 'simple';
  suffixForVowelStart: 'way' | 'yay';
  suffixForConsonantStart: string;
  treatYAsVowel: 'never' | 'sometimes' | 'always';
  preserveCase: boolean;
  handleQu: boolean;
  apostrophes: 'preserve' | 'splitPossessive';
}

const DEFAULT_PARAMS: PigLatinParams = {
  style: 'classic',
  suffixForVowelStart: 'way',
  suffixForConsonantStart: 'ay',
  treatYAsVowel: 'sometimes',
  preserveCase: true,
  handleQu: true,
  apostrophes: 'splitPossessive',
};

function isVowel(ch: string, position: number, params: PigLatinParams): boolean {
  if (VOWELS.has(ch)) return true;
  const lower = ch.toLowerCase();
  if (lower === 'y') {
    if (params.treatYAsVowel === 'always') return true;
    if (params.treatYAsVowel === 'never') return false;
    // "sometimes": y is a vowel when not at the start of a word
    return position > 0;
  }
  return false;
}

function isUpperCase(ch: string): boolean {
  return ch >= 'A' && ch <= 'Z';
}

function transferCase(source: string, target: string): string {
  const result: string[] = [];
  for (let i = 0; i < target.length; i++) {
    const ch = target[i]!;
    if (i < source.length && isUpperCase(source[i]!)) {
      result.push(ch.toUpperCase());
    } else {
      result.push(ch.toLowerCase());
    }
  }
  return result.join('');
}

function transformWord(word: string, params: PigLatinParams): string {
  // Handle possessive splitting
  let base = word;
  let suffix = '';
  if (params.apostrophes === 'splitPossessive') {
    const possessiveMatch = word.match(/^(.+?)('s)$/i);
    if (possessiveMatch) {
      base = possessiveMatch[1]!;
      suffix = possessiveMatch[2]!;
    }
  }

  const lower = base.toLowerCase();

  // Check if starts with vowel
  if (isVowel(lower[0]!, 0, params)) {
    const transformed = base + params.suffixForVowelStart;
    return (params.preserveCase ? transferCase(base + '   ', transformed) : transformed) + suffix;
  }

  // Find consonant cluster
  let clusterEnd = 0;
  while (clusterEnd < lower.length && !isVowel(lower[clusterEnd]!, clusterEnd, params)) {
    clusterEnd++;
    // Handle "qu" as a unit
    if (params.handleQu && clusterEnd > 0 && lower[clusterEnd - 1] === 'q' && lower[clusterEnd] === 'u') {
      clusterEnd++;
    }
  }

  if (clusterEnd === 0 || clusterEnd >= lower.length) {
    // No consonant cluster found or all consonants: just append suffix
    const transformed = base + params.suffixForConsonantStart;
    return (params.preserveCase ? transferCase(base + '  ', transformed) : transformed) + suffix;
  }

  const cluster = base.slice(0, clusterEnd);
  const rest = base.slice(clusterEnd);
  const rawTransformed = rest + cluster.toLowerCase() + params.suffixForConsonantStart;

  if (params.preserveCase) {
    return transferCase(base + '  ', rawTransformed) + suffix;
  }

  return rawTransformed + suffix;
}

export const pigLatinTransform: IOutputTransform = {
  id: 'pigLatin',
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
      if (p.style && p.style !== 'classic' && p.style !== 'simple') {
        errors.push('style must be "classic" or "simple"');
      }
      if (p.suffixForVowelStart && p.suffixForVowelStart !== 'way' && p.suffixForVowelStart !== 'yay') {
        errors.push('suffixForVowelStart must be "way" or "yay"');
      }
      if (p.treatYAsVowel && !['never', 'sometimes', 'always'].includes(p.treatYAsVowel as string)) {
        errors.push('treatYAsVowel must be "never", "sometimes", or "always"');
      }
      if (p.apostrophes && p.apostrophes !== 'preserve' && p.apostrophes !== 'splitPossessive') {
        errors.push('apostrophes must be "preserve" or "splitPossessive"');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: PigLatinParams = { ...DEFAULT_PARAMS, ...(input.params as Partial<PigLatinParams>) };
    const tokens: Token[] = [];
    let changedCount = 0;

    for (const token of input.tokens) {
      if (token.type === 'word' && !isProtected(token)) {
        const transformed = transformWord(token.value, params);
        if (transformed !== token.value) changedCount++;
        tokens.push({ ...token, value: transformed });
      } else {
        tokens.push({ ...token });
      }
    }

    return { tokens };
  },
};
