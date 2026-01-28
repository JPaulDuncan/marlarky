/**
 * Default Transform Registry
 * Pre-loaded with all V1 transforms.
 */

import { TransformRegistry } from './registry.js';
import { V1_TRANSFORMS } from './transforms/index.js';

/**
 * Create a new TransformRegistry pre-loaded with all V1 built-in transforms.
 */
export function createDefaultRegistry(): TransformRegistry {
  const registry = new TransformRegistry();
  for (const transform of V1_TRANSFORMS) {
    registry.register(transform);
  }
  return registry;
}
