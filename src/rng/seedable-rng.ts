/**
 * Seedable Random Number Generator
 * Implements a Mulberry32 PRNG for deterministic output
 */

import type { IRng, WeightedItem } from '../interfaces/rng.js';

/**
 * Mulberry32 - a fast, high-quality 32-bit PRNG
 */
function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

export class SeedableRng implements IRng {
  private _seed: number;
  private _next: () => number;

  constructor(seed: number = Date.now()) {
    this._seed = seed;
    this._next = mulberry32(seed);
  }

  seed(n: number): void {
    this._seed = n;
    this._next = mulberry32(n);
  }

  get currentSeed(): number {
    return this._seed;
  }

  float(): number {
    return this._next();
  }

  int(min: number, max: number): number {
    if (min > max) {
      [min, max] = [max, min];
    }
    return Math.floor(this.float() * (max - min + 1)) + min;
  }

  pick<T>(list: T[]): T {
    if (list.length === 0) {
      throw new Error('Cannot pick from empty list');
    }
    return list[this.int(0, list.length - 1)]!;
  }

  weightedPick<T>(items: WeightedItem<T>[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from empty weighted list');
    }

    // Filter out zero/negative weights
    const validItems = items.filter(i => i.weight > 0);
    if (validItems.length === 0) {
      throw new Error('All weights are zero or negative');
    }

    const totalWeight = validItems.reduce((sum, item) => sum + item.weight, 0);
    let random = this.float() * totalWeight;

    for (const item of validItems) {
      random -= item.weight;
      if (random <= 0) {
        return item.item;
      }
    }

    // Fallback (shouldn't happen, but for safety)
    return validItems[validItems.length - 1]!.item;
  }

  shuffle<T>(list: T[]): T[] {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [result[i], result[j]] = [result[j]!, result[i]!];
    }
    return result;
  }

  chance(probability: number): boolean {
    return this.float() < probability;
  }
}
