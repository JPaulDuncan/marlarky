---
title: Faker Integration
layout: default
parent: Guides
nav_order: 4
---

# Faker Integration

Marlarky supports two word provider adapters. The built-in `SimpleFakerAdapter` works with zero dependencies. For more word variety, use `FakerJsAdapter` with the popular `@faker-js/faker` library.

## SimpleFakerAdapter

The default adapter. Ships with Marlarky and provides a fixed vocabulary of common English words covering all parts of speech.

```typescript
import { TextGenerator, SimpleFakerAdapter } from 'marlarky';

const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});
```

**Pros:**
- Zero external dependencies
- Fast and lightweight
- Consistent vocabulary across environments

**Cons:**
- Limited word variety (fixed vocabulary)
- No domain-specific words beyond the built-in set

## FakerJsAdapter

Wraps `@faker-js/faker` to provide a much larger and more varied word pool.

### Installation

`@faker-js/faker` is an optional peer dependency:

```bash
npm install @faker-js/faker
```

### Usage

```typescript
import { TextGenerator, FakerJsAdapter } from 'marlarky';
import { faker } from '@faker-js/faker';

const generator = new TextGenerator({
  fakerAdapter: new FakerJsAdapter(faker),
});

console.log(generator.sentence());
```

**Pros:**
- Much larger vocabulary
- More natural-sounding text
- Access to faker's localization features

**Cons:**
- Adds `@faker-js/faker` as a dependency (~6MB)
- Word selection is less predictable

## When to use which

| Scenario | Recommended Adapter |
|----------|-------------------|
| Library with minimal dependencies | `SimpleFakerAdapter` |
| Testing and mocking | Either (SimpleFaker for consistency) |
| Placeholder text generation | `FakerJsAdapter` for variety |
| With a custom lexicon | Either (lexicon words take priority) |
| CI/CD environments | `SimpleFakerAdapter` for smaller install |

When using a lexicon, the adapter serves as a fallback -- lexicon terms are preferred when available. This means the choice of adapter matters less with a well-populated lexicon.

## IFakerAdapter interface

To implement a custom adapter, implement the `IFakerAdapter` interface:

```typescript
interface IFakerAdapter {
  noun(): string;
  verb(): string;
  adjective(): string;
  adverb(): string;
  preposition(): string;
  conjunction(): string;
  interjection(): string;
  determiner(): string;
}
```

Each method returns a random word of the given part of speech. The generator calls these as fallbacks when the lexicon doesn't have matching terms.

```typescript
const myAdapter: IFakerAdapter = {
  noun: () => 'thing',
  verb: () => 'do',
  adjective: () => 'good',
  adverb: () => 'well',
  preposition: () => 'of',
  conjunction: () => 'and',
  interjection: () => 'oh',
  determiner: () => 'the',
};

const generator = new TextGenerator({
  fakerAdapter: myAdapter,
});
```
