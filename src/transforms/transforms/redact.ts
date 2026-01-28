/**
 * Redaction Transform (id="redact")
 * Redact certain tokens while keeping grammar readable.
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

interface RedactParams {
  rate: number;
  targets: ('noun' | 'properNoun' | 'number' | 'any')[];
  style: '[REDACTED]' | '\u2588\u2588\u2588\u2588' | 'blackBar';
  minTokenLength: number;
  preserveCase: boolean;
}

const DEFAULT_PARAMS: RedactParams = {
  rate: 0.10,
  targets: ['noun', 'properNoun'],
  style: '[REDACTED]',
  minTokenLength: 4,
  preserveCase: false,
};

const STYLE_MAP: Record<string, string> = {
  '[REDACTED]': '[REDACTED]',
  '\u2588\u2588\u2588\u2588': '\u2588\u2588\u2588\u2588',
  'blackBar': '\u2588\u2588\u2588\u2588',
};

/** Heuristic: title-case word not at sentence start might be a proper noun */
function isTitleCase(word: string): boolean {
  return word.length > 1 && word[0]! >= 'A' && word[0]! <= 'Z' && word[1]! >= 'a' && word[1]! <= 'z';
}

export const redactTransform: IOutputTransform = {
  id: 'redact',
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
      if (p.rate !== undefined) {
        const rate = p.rate as number;
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
          errors.push('rate must be between 0 and 1');
        }
      }
      if (p.targets !== undefined && !Array.isArray(p.targets)) {
        errors.push('targets must be an array');
      }
      if (p.style !== undefined) {
        const valid = ['[REDACTED]', '\u2588\u2588\u2588\u2588', 'blackBar'];
        if (!valid.includes(p.style as string)) {
          errors.push('style must be "[REDACTED]", "████", or "blackBar"');
        }
      }
      if (p.minTokenLength !== undefined && (typeof p.minTokenLength !== 'number' || p.minTokenLength < 0)) {
        errors.push('minTokenLength must be a non-negative number');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: RedactParams = { ...DEFAULT_PARAMS, ...(input.params as Partial<RedactParams>) };
    const tokens: Token[] = [];
    const redactStyle = STYLE_MAP[params.style] ?? '[REDACTED]';

    // Determine which tokens are at sentence start (for properNoun heuristic)
    const sentenceStarts = new Set<number>();
    let afterPunct = true;
    for (let i = 0; i < input.tokens.length; i++) {
      const t = input.tokens[i]!;
      if (t.type === 'word') {
        if (afterPunct) sentenceStarts.add(i);
        afterPunct = false;
      }
      if (t.type === 'punct' && (t.value === '.' || t.value === '!' || t.value === '?')) {
        afterPunct = true;
      }
    }

    const targetsSet = new Set(params.targets);

    for (let i = 0; i < input.tokens.length; i++) {
      const token = input.tokens[i]!;

      if (token.type === 'number' && targetsSet.has('number') && !isProtected(token)) {
        if (input.rng.chance(params.rate)) {
          tokens.push({ ...token, value: redactStyle, type: 'symbol' });
          continue;
        }
      }

      if (token.type === 'word' && !isProtected(token) && token.value.length >= params.minTokenLength) {
        let shouldRedact = false;

        if (targetsSet.has('any')) {
          shouldRedact = input.rng.chance(params.rate);
        } else {
          // Proper noun heuristic
          if (targetsSet.has('properNoun') && isTitleCase(token.value) && !sentenceStarts.has(i)) {
            shouldRedact = input.rng.chance(params.rate);
          }
          // Noun heuristic: use rate as probability for every eligible word
          if (!shouldRedact && targetsSet.has('noun')) {
            shouldRedact = input.rng.chance(params.rate);
          }
        }

        if (shouldRedact) {
          tokens.push({ ...token, value: redactStyle, type: 'symbol' });
          continue;
        }
      }

      tokens.push({ ...token });
    }

    return { tokens };
  },
};
