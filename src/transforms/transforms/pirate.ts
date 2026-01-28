/**
 * Pirate Transform (id="pirate")
 * Phrase substitutions + interjections.
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

interface PirateParams {
  phraseMap: Record<string, string>;
  interjections: string[];
  interjectionRate: number;
  preserveCase: boolean;
}

const DEFAULT_PHRASE_MAP: Record<string, string> = {
  'my': 'me',
  'you': 'ye',
  'your': 'yer',
  'is': 'be',
  'are': 'be',
  'am': 'be',
  'friend': 'matey',
  'friends': 'mateys',
  'hello': 'ahoy',
  'hi': 'ahoy',
  'the': 'th\'',
  'money': 'booty',
  'treasure': 'booty',
  'man': 'landlubber',
  'woman': 'lass',
  'boy': 'lad',
  'girl': 'lass',
  'sir': 'cap\'n',
  'madam': 'lass',
  'fight': 'duel',
  'food': 'grub',
  'drink': 'grog',
  'ocean': 'sea',
  'jail': 'brig',
  'stupid': 'scurvy',
  'old': 'barnacled',
};

const DEFAULT_INTERJECTIONS = ['Arr!', 'Yo-ho-ho!', 'Ahoy!', 'Shiver me timbers!', 'Blimey!'];

const DEFAULT_PARAMS: PirateParams = {
  phraseMap: DEFAULT_PHRASE_MAP,
  interjections: DEFAULT_INTERJECTIONS,
  interjectionRate: 0.05,
  preserveCase: true,
};

function matchCase(source: string, target: string): string {
  if (source.length === 0 || target.length === 0) return target;
  // All uppercase
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return target.toUpperCase();
  }
  // Title case (first letter uppercase)
  if (source[0]! >= 'A' && source[0]! <= 'Z') {
    return target[0]!.toUpperCase() + target.slice(1);
  }
  return target.toLowerCase();
}

export const pirateTransform: IOutputTransform = {
  id: 'pirate',
  version: '1.0.0',
  capabilities: {
    requiresTrace: false,
    posAware: false,
    deterministic: true,
    safeToStack: true,
    preferredOrder: 10,
  } satisfies TransformCapabilities,

  validateParams(params: unknown): ValidationResult {
    const errors: string[] = [];
    if (params && typeof params === 'object') {
      const p = params as Record<string, unknown>;
      if (p.interjectionRate !== undefined) {
        const rate = p.interjectionRate as number;
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
          errors.push('interjectionRate must be between 0 and 1');
        }
      }
      if (p.phraseMap !== undefined && (typeof p.phraseMap !== 'object' || p.phraseMap === null)) {
        errors.push('phraseMap must be an object');
      }
      if (p.interjections !== undefined && !Array.isArray(p.interjections)) {
        errors.push('interjections must be an array');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: PirateParams = {
      ...DEFAULT_PARAMS,
      ...(input.params as Partial<PirateParams>),
      phraseMap: {
        ...DEFAULT_PHRASE_MAP,
        ...((input.params as Partial<PirateParams>).phraseMap ?? {}),
      },
    };
    const tokens: Token[] = [];

    // Build lowercase lookup
    const lowerMap = new Map<string, string>();
    for (const [k, v] of Object.entries(params.phraseMap)) {
      lowerMap.set(k.toLowerCase(), v);
    }

    // Maybe prepend interjection at start of sentence
    let insertedInterjection = false;
    if (params.interjections.length > 0 && input.rng.chance(params.interjectionRate)) {
      // Find first word token
      const firstWordIdx = input.tokens.findIndex(t => t.type === 'word');
      if (firstWordIdx >= 0) {
        insertedInterjection = true;
      }
    }

    // Process tokens
    let isFirst = true;
    for (let i = 0; i < input.tokens.length; i++) {
      const token = input.tokens[i]!;

      // Insert interjection before first word
      if (insertedInterjection && isFirst && token.type === 'word') {
        const interjection = input.rng.pick(params.interjections);
        tokens.push({ type: 'word', value: interjection });
        tokens.push({ type: 'whitespace', value: ' ' });
        // Lowercase the formerly-capitalized first word since interjection takes the capital
        if (params.preserveCase && token.value[0]! >= 'A' && token.value[0]! <= 'Z') {
          const lowerFirst = token.value[0]!.toLowerCase() + token.value.slice(1);
          const replacement = lowerMap.get(lowerFirst.toLowerCase());
          if (replacement && !isProtected(token)) {
            tokens.push({ ...token, value: replacement });
          } else {
            tokens.push({ ...token, value: lowerFirst });
          }
          isFirst = false;
          continue;
        }
      }

      if (token.type === 'word' && !isProtected(token)) {
        const lower = token.value.toLowerCase();
        const replacement = lowerMap.get(lower);
        if (replacement) {
          const cased = params.preserveCase ? matchCase(token.value, replacement) : replacement;
          tokens.push({ ...token, value: cased });
        } else {
          tokens.push({ ...token });
        }
      } else {
        tokens.push({ ...token });
      }

      if (token.type === 'word') isFirst = false;
    }

    return { tokens };
  },
};
