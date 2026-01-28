/**
 * Transform Pipeline Executor
 * Runs transform steps in order with seed-scoped RNG per step.
 */

import type {
  Token,
  OutputTransformsConfig,
  TransformStep,
  TransformEvent,
  OutputTokenTrace,
} from './types.js';
import type { IRng } from '../interfaces/rng.js';
import { SeedableRng } from '../rng/seedable-rng.js';
import type { TransformRegistry } from './registry.js';
import { applyProtection } from './protection.js';
import { tokenize, render } from './tokenizer.js';

/** Simple string hash for deterministic RNG forking */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return hash >>> 0; // ensure unsigned 32-bit
}

/** Simple object hash for params tracing */
function hashParams(params: Record<string, unknown>): string {
  try {
    const json = JSON.stringify(params, Object.keys(params).sort());
    return String(hashString(json));
  } catch {
    return '0';
  }
}

/** Result of pipeline execution */
export interface PipelineResult {
  /** Final rendered text */
  text: string;
  /** Final tokens */
  tokens: Token[];
  /** Output token traces (original vs transformed) */
  outputTokens?: OutputTokenTrace[];
  /** Transform events for each step */
  transformEvents?: TransformEvent[];
  /** IDs of transforms that were applied */
  transformsApplied: string[];
}

/**
 * Execute the output transform pipeline on raw text.
 */
export function executePipeline(
  text: string,
  config: OutputTransformsConfig,
  registry: TransformRegistry,
  baseSeed: number,
  traceEnabled: boolean,
): PipelineResult {
  if (!config.enabled || config.pipeline.length === 0) {
    return {
      text,
      tokens: tokenize(text),
      transformsApplied: [],
    };
  }

  // 1. Tokenize
  let tokens = tokenize(text);

  // Capture originals for trace
  const originals = traceEnabled
    ? tokens.map(t => ({ type: t.type, value: t.value }))
    : undefined;

  // 2. Apply protection
  applyProtection(tokens, config.protection);

  // 3. Validate and collect pipeline steps
  const steps = collectValidSteps(config.pipeline, registry, config.strict);

  // 4. Optionally auto-order
  if (config.autoOrder) {
    steps.sort((a, b) => {
      const orderA = a.transform.capabilities.preferredOrder ?? 50;
      const orderB = b.transform.capabilities.preferredOrder ?? 50;
      return orderA - orderB;
    });
  }

  // 5. Execute each step
  const transformEvents: TransformEvent[] = [];
  const transformsApplied: string[] = [];
  const allWarnings: string[][] = [];

  for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
    const { step, transform } = steps[stepIndex]!;
    const params = step.params ?? {};

    // Fork RNG for this step
    const stepSeed = (baseSeed + hashString(transform.id + String(stepIndex))) >>> 0;
    const stepRng: IRng = new SeedableRng(stepSeed);

    // Validate params
    const validation = transform.validateParams(params);
    if (!validation.valid) {
      if (config.strict) {
        throw new Error(
          `Transform "${transform.id}" invalid params: ${validation.errors.join(', ')}`
        );
      }
      // Skip with warning
      const warnings = [`Skipped: invalid params - ${validation.errors.join(', ')}`];
      if (traceEnabled) {
        transformEvents.push({
          transformId: transform.id,
          paramsHash: hashParams(params),
          tokensChangedCount: 0,
          warnings,
        });
      }
      allWarnings.push(warnings);
      continue;
    }

    // Count tokens before for change tracking
    const beforeValues = traceEnabled ? tokens.map(t => t.value) : undefined;

    // Apply transform
    const output = transform.apply({
      tokens,
      params,
      rng: stepRng,
      protection: config.protection,
      traceEnabled,
    });

    tokens = output.tokens;
    transformsApplied.push(transform.id);

    // Track events
    if (traceEnabled) {
      let changedCount = 0;
      if (beforeValues) {
        for (let i = 0; i < Math.max(beforeValues.length, tokens.length); i++) {
          if (i >= beforeValues.length || i >= tokens.length || beforeValues[i] !== tokens[i]?.value) {
            changedCount++;
          }
        }
      }

      transformEvents.push({
        transformId: transform.id,
        paramsHash: hashParams(params),
        tokensChangedCount: changedCount,
        warnings: output.warnings,
      });
    }

    if (output.warnings) {
      allWarnings.push(output.warnings);
    }
  }

  // 6. Build trace
  let outputTokens: OutputTokenTrace[] | undefined;
  if (traceEnabled && originals) {
    outputTokens = [];
    const maxLen = Math.max(originals.length, tokens.length);
    for (let i = 0; i < maxLen; i++) {
      const orig = originals[i];
      const transformed = tokens[i];
      outputTokens.push({
        type: (transformed?.type ?? orig?.type ?? 'symbol') as OutputTokenTrace['type'],
        original: orig?.value ?? '',
        transformed: transformed?.value ?? '',
        protected: transformed?.meta?.protected ?? false,
        protectionsApplied: transformed?.meta?.protectionsApplied,
      });
    }
  }

  return {
    text: render(tokens),
    tokens,
    outputTokens,
    transformEvents: traceEnabled ? transformEvents : undefined,
    transformsApplied,
  };
}

/** Collect and validate pipeline steps, resolving transforms from registry */
function collectValidSteps(
  pipeline: TransformStep[],
  registry: TransformRegistry,
  strict: boolean,
): Array<{ step: TransformStep; transform: ReturnType<TransformRegistry['get']> & object }> {
  const result: Array<{ step: TransformStep; transform: ReturnType<TransformRegistry['get']> & object }> = [];

  for (const step of pipeline) {
    const transform = registry.get(step.id);
    if (!transform) {
      if (strict) {
        throw new Error(`Unknown transform ID: "${step.id}"`);
      }
      continue; // skip unknown
    }
    result.push({ step, transform });
  }

  return result;
}

/**
 * Check pipeline ordering and return warnings for non-recommended orderings.
 */
export function checkPipelineOrder(
  pipeline: TransformStep[],
  registry: TransformRegistry,
): string[] {
  const warnings: string[] = [];
  let lastOrder = -Infinity;

  for (const step of pipeline) {
    const transform = registry.get(step.id);
    if (!transform) continue;

    const order = transform.capabilities.preferredOrder ?? 50;
    if (order < lastOrder) {
      warnings.push(
        `Transform "${step.id}" (order ${order}) appears after a transform with higher structural impact (order ${lastOrder}). Consider reordering.`
      );
    }
    lastOrder = order;
  }

  return warnings;
}
