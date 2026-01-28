/**
 * Faker.js Adapter
 * Adapts @faker-js/faker to IFakerAdapter interface
 */

import type { IFakerAdapter } from '../interfaces/faker-adapter.js';

// Type for the faker instance
type FakerInstance = {
  word: {
    adjective: () => string;
    adverb: () => string;
    noun: () => string;
    verb: () => string;
    preposition: () => string;
    conjunction: () => string;
    interjection: () => string;
  };
  person: {
    firstName: () => string;
    lastName: () => string;
  };
  location: {
    city: () => string;
  };
  number: {
    int: (options: { min: number; max: number }) => number;
  };
};

export class FakerJsAdapter implements IFakerAdapter {
  private faker: FakerInstance;

  constructor(faker: FakerInstance) {
    this.faker = faker;
  }

  adjective(): string {
    return this.faker.word.adjective();
  }

  adverb(): string {
    return this.faker.word.adverb();
  }

  noun(): string {
    return this.faker.word.noun();
  }

  verb(): string {
    return this.faker.word.verb();
  }

  preposition(): string {
    return this.faker.word.preposition();
  }

  conjunction(): string {
    return this.faker.word.conjunction();
  }

  interjection(): string {
    return this.faker.word.interjection();
  }

  properNoun(): string {
    // Mix of first names, last names, and cities
    const options = [
      () => this.faker.person.firstName(),
      () => this.faker.person.lastName(),
      () => this.faker.location.city(),
    ];
    const index = this.faker.number.int({ min: 0, max: options.length - 1 });
    return options[index]!();
  }

  number(): string {
    const num = this.faker.number.int({ min: 1, max: 100 });
    return String(num);
  }
}
