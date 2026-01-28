/**
 * Corporate Jargon Transform (id="bizJargon")
 * Replace common verbs/adjectives with corporate synonyms.
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

interface BizJargonParams {
  rate: number;
  map: Record<string, string[]>;
  caseInsensitive: boolean;
  preserveCase: boolean;
}

const DEFAULT_MAP: Record<string, string[]> = {
  'use': ['leverage', 'utilize'],
  'help': ['enable', 'empower', 'facilitate'],
  'change': ['drive', 'pivot', 'transform'],
  'start': ['kick off', 'greenlight', 'initiate'],
  'plan': ['roadmap', 'strategize'],
  'talk': ['align', 'sync', 'circle back'],
  'meet': ['sync', 'connect', 'huddle'],
  'ask': ['reach out', 'ping', 'loop in'],
  'work': ['collaborate', 'execute', 'operationalize'],
  'think': ['ideate', 'brainstorm', 'synergize'],
  'try': ['iterate', 'explore', 'pilot'],
  'make': ['build', 'architect', 'craft'],
  'improve': ['optimize', 'uplevel', 'enhance'],
  'show': ['showcase', 'demo', 'surface'],
  'give': ['deliver', 'provide', 'offer'],
  'get': ['secure', 'acquire', 'obtain'],
  'tell': ['communicate', 'message', 'brief'],
  'end': ['sunset', 'deprecate', 'wind down'],
  'fix': ['remediate', 'resolve', 'address'],
  'move': ['transition', 'migrate', 'shift'],
  'big': ['scalable', 'enterprise-grade', 'robust'],
  'good': ['best-in-class', 'world-class', 'premium'],
  'new': ['innovative', 'cutting-edge', 'next-gen'],
  'fast': ['agile', 'nimble', 'rapid'],
  'important': ['mission-critical', 'high-priority', 'key'],
  'hard': ['challenging', 'complex', 'non-trivial'],
  'problem': ['challenge', 'opportunity', 'pain point'],
  'idea': ['initiative', 'value proposition', 'thought leadership'],
  'result': ['outcome', 'deliverable', 'KPI'],
  'effect': ['impact', 'value-add', 'ROI'],
  'team': ['squad', 'pod', 'task force'],
  'goal': ['OKR', 'north star', 'target'],
  'money': ['capital', 'budget', 'resources'],
  'way': ['methodology', 'framework', 'approach'],
};

const DEFAULT_PARAMS: BizJargonParams = {
  rate: 0.18,
  map: DEFAULT_MAP,
  caseInsensitive: true,
  preserveCase: true,
};

function matchCase(source: string, target: string): string {
  if (source.length === 0 || target.length === 0) return target;
  if (source === source.toUpperCase() && source !== source.toLowerCase()) {
    return target.toUpperCase();
  }
  if (source[0]! >= 'A' && source[0]! <= 'Z') {
    return target[0]!.toUpperCase() + target.slice(1);
  }
  return target.toLowerCase();
}

export const bizJargonTransform: IOutputTransform = {
  id: 'bizJargon',
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
    const params: BizJargonParams = {
      ...DEFAULT_PARAMS,
      ...(input.params as Partial<BizJargonParams>),
      map: {
        ...DEFAULT_MAP,
        ...((input.params as Partial<BizJargonParams>).map ?? {}),
      },
    };
    const tokens: Token[] = [];

    // Build lookup
    const lowerMap = new Map<string, string[]>();
    for (const [k, v] of Object.entries(params.map)) {
      lowerMap.set(params.caseInsensitive ? k.toLowerCase() : k, v);
    }

    for (const token of input.tokens) {
      if (token.type === 'word' && !isProtected(token)) {
        const lookupKey = params.caseInsensitive ? token.value.toLowerCase() : token.value;
        const replacements = lowerMap.get(lookupKey);

        if (replacements && replacements.length > 0 && input.rng.chance(params.rate)) {
          // Deterministic selection: use first option
          const replacement = replacements[0]!;
          const cased = params.preserveCase ? matchCase(token.value, replacement) : replacement;
          tokens.push({ ...token, value: cased });
          continue;
        }
      }

      tokens.push({ ...token });
    }

    return { tokens };
  },
};
