/**
 * Simple Faker Adapter
 * A basic implementation that uses built-in word lists when @faker-js/faker isn't available
 */

import type { IFakerAdapter } from '../interfaces/faker-adapter.js';
import type { IRng } from '../interfaces/rng.js';
import { SeedableRng } from '../rng/index.js';
import * as defaults from '../defaults/index.js';

export class SimpleFakerAdapter implements IFakerAdapter {
  private rng: IRng;

  constructor(rng?: IRng) {
    this.rng = rng ?? new SeedableRng();
  }

  adjective(): string {
    return this.rng.pick(defaults.DEFAULT_ADJECTIVES);
  }

  adverb(): string {
    return this.rng.pick(defaults.DEFAULT_ADVERBS);
  }

  noun(): string {
    return this.rng.pick(defaults.DEFAULT_NOUNS);
  }

  verb(): string {
    return this.rng.pick(defaults.DEFAULT_VERBS);
  }

  preposition(): string {
    return this.rng.pick(defaults.DEFAULT_PREPOSITIONS);
  }

  conjunction(): string {
    return this.rng.pick(defaults.DEFAULT_CONJUNCTIONS);
  }

  interjection(): string {
    return this.rng.pick(defaults.DEFAULT_INTERJECTIONS);
  }

  properNoun(): string {
    const names = [
      'John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana',
      'Edward', 'Fiona', 'George', 'Helen', 'Ivan', 'Julia',
      'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Davis',
      'London', 'Paris', 'Tokyo', 'Sydney', 'Berlin', 'Madrid',
    ];
    return this.rng.pick(names);
  }

  number(): string {
    const numbers = [
      'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'twenty', 'fifty', 'hundred',
    ];
    return this.rng.pick(numbers);
  }

  /** Set the RNG seed */
  seed(n: number): void {
    this.rng.seed(n);
  }
}
