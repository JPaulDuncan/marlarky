---
title: Deterministic Output
layout: default
parent: Guides
nav_order: 2
---

# Deterministic Output

Marlarky uses a seedable random number generator (RNG). Setting a seed makes all output reproducible -- the same seed with the same configuration always produces identical text.

## Basic usage

```typescript
generator.setSeed(12345);
const text1 = generator.sentence();

generator.setSeed(12345);
const text2 = generator.sentence();

console.log(text1 === text2); // true
```

From the CLI:

```bash
marlarky sentence --seed 12345
marlarky sentence --seed 12345
# Both print the same sentence
```

## How it works

The internal `SeedableRng` is a deterministic pseudo-random number generator. Every call to `setSeed()` resets the RNG state. From that point, every random choice (sentence type, word selection, adjective count, etc.) follows the same sequence.

This means:
- Same seed + same config = same text
- Same seed + different config = different text (because different choices are made)
- Same seed + same config + different lexicon = different text (because the word pool changes)

## Testing patterns

Deterministic output is useful for snapshot testing:

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
});

// In your test
generator.setSeed(42);
const baseline = generator.sentence();

// Later, in a regression test
generator.setSeed(42);
expect(generator.sentence()).toBe(baseline);
```

This lets you detect unintended changes in text generation behavior when modifying the library.

## Transforms and determinism

Each transform in the pipeline gets its own RNG fork derived from the base seed. This means:
- Transform output is deterministic
- Adding or removing a transform doesn't change the base text generation
- The same pipeline with the same seed always produces the same result

```typescript
generator.setSeed(42);
const result1 = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'pigLatin' }],
  },
});

generator.setSeed(42);
const result2 = generator.sentence({
  outputTransforms: {
    enabled: true,
    pipeline: [{ id: 'pigLatin' }],
  },
});

console.log(result1 === result2); // true (or result1.text === result2.text with tracing)
```

## Custom RNG

You can provide your own RNG implementation via `GeneratorInitOptions.rng`. It must implement the `IRng` interface:

```typescript
interface IRng {
  next(): number;           // Returns a float in [0, 1)
  fork(): IRng;             // Creates a deterministic child RNG
  seed(value: number): void; // Resets the RNG state
}
```

```typescript
const generator = new TextGenerator({
  fakerAdapter: new SimpleFakerAdapter(),
  rng: myCustomRng,
});
```

Most users won't need a custom RNG -- the built-in `SeedableRng` works for all standard use cases.
