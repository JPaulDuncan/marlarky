/**
 * Leetspeak Transform (id="leet")
 * Character/cluster substitution.
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

interface LeetParams {
  intensity: number;
  preserveCase: boolean;
  map: Record<string, string[]>;
  clusterFirst: boolean;
}

const DEFAULT_MAP: Record<string, string[]> = {
  'ck': ['x'],
  'a': ['4', '@'],
  'e': ['3'],
  'i': ['1', '!'],
  'o': ['0'],
  's': ['5', '$'],
  't': ['7'],
  'g': ['9'],
  'b': ['8'],
  'l': ['1'],
};

const DEFAULT_PARAMS: LeetParams = {
  intensity: 0.35,
  preserveCase: true,
  map: DEFAULT_MAP,
  clusterFirst: true,
};

function transformWord(word: string, params: LeetParams, rng: IRng): string {
  const result: string[] = [];
  const lower = word.toLowerCase();

  // Sort keys: clusters first (longer keys first) if clusterFirst
  const keys = Object.keys(params.map).sort((a, b) => {
    if (params.clusterFirst) return b.length - a.length;
    return 0;
  });

  let i = 0;
  while (i < word.length) {
    let matched = false;

    // Try cluster matches
    for (const key of keys) {
      if (lower.slice(i, i + key.length) === key) {
        // Check intensity
        if (rng.chance(params.intensity)) {
          const replacements = params.map[key]!;
          const replacement = replacements[0]!; // deterministic: use first option
          if (params.preserveCase && word[i]! >= 'A' && word[i]! <= 'Z') {
            result.push(replacement.toUpperCase());
          } else {
            result.push(replacement);
          }
          i += key.length;
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      result.push(word[i]!);
      i++;
    }
  }

  return result.join('');
}

export const leetTransform: IOutputTransform = {
  id: 'leet',
  version: '1.0.0',
  capabilities: {
    requiresTrace: false,
    posAware: false,
    deterministic: true,
    safeToStack: true,
    preferredOrder: 30,
  } satisfies TransformCapabilities,

  validateParams(params: unknown): ValidationResult {
    const errors: string[] = [];
    if (params && typeof params === 'object') {
      const p = params as Record<string, unknown>;
      if (p.intensity !== undefined) {
        const intensity = p.intensity as number;
        if (typeof intensity !== 'number' || intensity < 0 || intensity > 1) {
          errors.push('intensity must be a number between 0 and 1');
        }
      }
      if (p.map !== undefined && (typeof p.map !== 'object' || p.map === null)) {
        errors.push('map must be an object');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: LeetParams = {
      ...DEFAULT_PARAMS,
      ...(input.params as Partial<LeetParams>),
      map: {
        ...DEFAULT_MAP,
        ...((input.params as Partial<LeetParams>).map ?? {}),
      },
    };
    const tokens: Token[] = [];

    for (const token of input.tokens) {
      if (token.type === 'word' && !isProtected(token)) {
        tokens.push({ ...token, value: transformWord(token.value, params, input.rng) });
      } else {
        tokens.push({ ...token });
      }
    }

    return { tokens };
  },
};
