/**
 * Transform Registry
 * Stores and retrieves registered IOutputTransform implementations.
 */

import type { IOutputTransform } from './types.js';

export class TransformRegistry {
  private transforms: Map<string, IOutputTransform> = new Map();

  /**
   * Register a transform. Overwrites if ID already exists.
   */
  register(transform: IOutputTransform): void {
    this.transforms.set(transform.id, transform);
  }

  /**
   * Get a transform by ID.
   */
  get(id: string): IOutputTransform | null {
    return this.transforms.get(id) ?? null;
  }

  /**
   * List all registered transforms.
   */
  list(): IOutputTransform[] {
    return Array.from(this.transforms.values());
  }

  /**
   * Check if a transform ID is registered.
   */
  has(id: string): boolean {
    return this.transforms.has(id);
  }
}
