/**
 * Random Number Generator Interface
 * Must be deterministic when seeded for reproducible output
 */
export interface IRng {
  /** Set the seed for deterministic output */
  seed(n: number): void;

  /** Return a float in [0, 1) */
  float(): number;

  /** Return an integer in [min, max] inclusive */
  int(min: number, max: number): number;

  /** Pick a random element from a non-empty array */
  pick<T>(list: T[]): T;

  /** Pick an element using weighted probability */
  weightedPick<T>(items: WeightedItem<T>[]): T;

  /** Shuffle an array (returns a new array) */
  shuffle<T>(list: T[]): T[];

  /** Return true with the given probability (0-1) */
  chance(probability: number): boolean;
}

export interface WeightedItem<T> {
  item: T;
  weight: number;
}
