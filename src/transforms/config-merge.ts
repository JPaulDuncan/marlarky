/**
 * Output Transforms Config Merge Logic
 *
 * Merge order (from lowest to highest priority):
 * 1. GeneratorConfig.outputTransforms (base)
 * 2. Lexicon defaults (if config allows)
 * 3. Archetype outputTransforms (if selected)
 * 4. Per-call overrides
 */

import type {
  OutputTransformsConfig,
  ProtectionConfig,
  LexiconOutputTransforms,
  ArchetypeOutputTransforms,
  OutputTransformsOverride,
} from './types.js';
import { DEFAULT_OUTPUT_TRANSFORMS_CONFIG, DEFAULT_PROTECTION_CONFIG } from './types.js';

/**
 * Merge all sources into a final OutputTransformsConfig.
 */
export function mergeOutputTransformsConfig(
  base?: Partial<OutputTransformsConfig>,
  lexiconDefaults?: LexiconOutputTransforms,
  archetypeTransforms?: ArchetypeOutputTransforms,
  perCallOverride?: OutputTransformsOverride,
): OutputTransformsConfig {
  // Start with defaults
  let result: OutputTransformsConfig = {
    ...DEFAULT_OUTPUT_TRANSFORMS_CONFIG,
    protection: { ...DEFAULT_PROTECTION_CONFIG },
  };

  // 1. Apply base config
  if (base) {
    result = {
      ...result,
      ...base,
      protection: {
        ...result.protection,
        ...base.protection,
      },
      pipeline: base.pipeline ?? result.pipeline,
    };
  }

  // 2. Apply lexicon defaults
  if (lexiconDefaults?.defaults && lexiconDefaults.defaults.length > 0) {
    // Lexicon defaults only apply if no explicit pipeline from base config
    if (result.pipeline.length === 0) {
      result.pipeline = [...lexiconDefaults.defaults];
    }
  }

  // 3. Apply archetype transforms
  if (archetypeTransforms?.pipeline && archetypeTransforms.pipeline.length > 0) {
    // Archetype replaces pipeline by default
    result.pipeline = [...archetypeTransforms.pipeline];
    // Enable transforms if archetype provides a pipeline
    result.enabled = true;
  }

  // 4. Apply per-call overrides
  if (perCallOverride?.outputTransforms) {
    const override = perCallOverride.outputTransforms;
    const mergeMode = perCallOverride.mergeMode ?? 'replace';

    if (override.enabled !== undefined) {
      result.enabled = override.enabled;
    }

    if (override.pipeline) {
      if (mergeMode === 'append') {
        result.pipeline = [...result.pipeline, ...override.pipeline];
      } else {
        result.pipeline = [...override.pipeline];
      }
    }

    if (override.protection) {
      result.protection = {
        ...result.protection,
        ...override.protection,
      };
    }

    if (override.strict !== undefined) {
      result.strict = override.strict;
    }

    if (override.autoOrder !== undefined) {
      result.autoOrder = override.autoOrder;
    }
  }

  return result;
}

/**
 * Merge protection configs.
 */
export function mergeProtectionConfig(
  ...configs: (Partial<ProtectionConfig> | undefined)[]
): ProtectionConfig {
  const result: ProtectionConfig = { ...DEFAULT_PROTECTION_CONFIG };

  for (const config of configs) {
    if (!config) continue;
    Object.assign(result, config);
  }

  return result;
}
