/**
 * Output Transform System
 * Public API for the transform pipeline.
 */

// Types
export type {
  Token,
  TokenType,
  TokenMeta,
  ProtectionConfig,
  TransformStep,
  OutputTransformsConfig,
  OutputTransformsOverride,
  TransformCapabilities,
  TransformInput,
  TransformOutput,
  ValidationResult,
  IOutputTransform,
  OutputTokenTrace,
  TransformEvent,
  LexiconOutputTransforms,
  ArchetypeOutputTransforms,
} from './types.js';

export {
  DEFAULT_PROTECTION_CONFIG,
  DEFAULT_OUTPUT_TRANSFORMS_CONFIG,
} from './types.js';

// Tokenizer
export { tokenize, render, classifyChar } from './tokenizer.js';

// Protection
export { applyProtection, isProtected } from './protection.js';

// Registry
export { TransformRegistry } from './registry.js';

// Default Registry
export { createDefaultRegistry } from './default-registry.js';

// Pipeline
export { executePipeline, checkPipelineOrder } from './pipeline.js';
export type { PipelineResult } from './pipeline.js';

// Config Merge
export { mergeOutputTransformsConfig, mergeProtectionConfig } from './config-merge.js';

// V1 Transforms
export {
  pigLatinTransform,
  ubbiDubbiTransform,
  leetTransform,
  uwuTransform,
  pirateTransform,
  redactTransform,
  emojiTransform,
  mockCaseTransform,
  reverseWordsTransform,
  bizJargonTransform,
  V1_TRANSFORMS,
} from './transforms/index.js';
