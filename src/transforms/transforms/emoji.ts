/**
 * Emoji-speak Transform (id="emoji")
 * Replace certain words with emojis using mapping tables.
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

interface EmojiParams {
  rate: number;
  map: Record<string, string[]>;
  fallbackToNone: boolean;
  preserveWordAlongsideEmoji: boolean;
  caseInsensitive: boolean;
}

const DEFAULT_MAP: Record<string, string[]> = {
  'happy': ['\uD83D\uDE0A', '\uD83D\uDE04'],
  'sad': ['\uD83D\uDE22', '\uD83D\uDE1E'],
  'love': ['\u2764\uFE0F', '\uD83D\uDC95'],
  'heart': ['\u2764\uFE0F', '\uD83D\uDC96'],
  'fire': ['\uD83D\uDD25'],
  'money': ['\uD83D\uDCB0', '\uD83D\uDCB5'],
  'star': ['\u2B50', '\uD83C\uDF1F'],
  'sun': ['\u2600\uFE0F', '\uD83C\uDF1E'],
  'moon': ['\uD83C\uDF19'],
  'rain': ['\uD83C\uDF27\uFE0F'],
  'snow': ['\u2744\uFE0F'],
  'tree': ['\uD83C\uDF33'],
  'flower': ['\uD83C\uDF38', '\uD83C\uDF3A'],
  'dog': ['\uD83D\uDC36'],
  'cat': ['\uD83D\uDC31'],
  'car': ['\uD83D\uDE97'],
  'house': ['\uD83C\uDFE0'],
  'book': ['\uD83D\uDCDA', '\uD83D\uDCD6'],
  'music': ['\uD83C\uDFB5', '\uD83C\uDFB6'],
  'food': ['\uD83C\uDF54', '\uD83C\uDF55'],
  'water': ['\uD83D\uDCA7'],
  'time': ['\u23F0', '\u231A'],
  'world': ['\uD83C\uDF0D'],
  'phone': ['\uD83D\uDCF1'],
  'computer': ['\uD83D\uDCBB'],
  'rocket': ['\uD83D\uDE80'],
  'idea': ['\uD83D\uDCA1'],
  'check': ['\u2705'],
  'cross': ['\u274C'],
  'warning': ['\u26A0\uFE0F'],
  'laugh': ['\uD83D\uDE02'],
  'think': ['\uD83E\uDD14'],
  'cool': ['\uD83D\uDE0E'],
  'strong': ['\uD83D\uDCAA'],
  'fast': ['\u26A1'],
  'slow': ['\uD83D\uDC22'],
  'big': ['\uD83D\uDCAF'],
  'small': ['\uD83E\uDD0F'],
  'good': ['\uD83D\uDC4D'],
  'bad': ['\uD83D\uDC4E'],
  'yes': ['\u2705'],
  'no': ['\u274C'],
  'king': ['\uD83D\uDC51'],
  'queen': ['\uD83D\uDC51'],
  'sleep': ['\uD83D\uDE34'],
  'wave': ['\uD83D\uDC4B'],
  'party': ['\uD83C\uDF89'],
  'brain': ['\uD83E\uDDE0'],
  'eyes': ['\uD83D\uDC40'],
  'hand': ['\u270B'],
};

const DEFAULT_PARAMS: EmojiParams = {
  rate: 0.12,
  map: DEFAULT_MAP,
  fallbackToNone: true,
  preserveWordAlongsideEmoji: false,
  caseInsensitive: true,
};

export const emojiTransform: IOutputTransform = {
  id: 'emoji',
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
      if (p.rate !== undefined) {
        const rate = p.rate as number;
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
          errors.push('rate must be between 0 and 1');
        }
      }
      if (p.map !== undefined && (typeof p.map !== 'object' || p.map === null)) {
        errors.push('map must be an object');
      }
    }
    return { valid: errors.length === 0, errors };
  },

  apply(input: TransformInput): TransformOutput {
    const params: EmojiParams = {
      ...DEFAULT_PARAMS,
      ...(input.params as Partial<EmojiParams>),
      map: {
        ...DEFAULT_MAP,
        ...((input.params as Partial<EmojiParams>).map ?? {}),
      },
    };
    const tokens: Token[] = [];

    // Build lookup map
    const lowerMap = new Map<string, string[]>();
    for (const [k, v] of Object.entries(params.map)) {
      lowerMap.set(params.caseInsensitive ? k.toLowerCase() : k, v);
    }

    for (const token of input.tokens) {
      if (token.type === 'word' && !isProtected(token)) {
        const lookupKey = params.caseInsensitive ? token.value.toLowerCase() : token.value;
        const emojis = lowerMap.get(lookupKey);

        if (emojis && emojis.length > 0 && input.rng.chance(params.rate)) {
          // Deterministic emoji selection
          const emoji = emojis[0]!;

          if (params.preserveWordAlongsideEmoji) {
            tokens.push({ ...token, value: token.value + ' ' + emoji });
          } else {
            tokens.push({ ...token, value: emoji, type: 'symbol' });
          }
          continue;
        }
      }

      tokens.push({ ...token });
    }

    return { tokens };
  },
};
